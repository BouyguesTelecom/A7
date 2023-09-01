/*
 * Copyright 2021 - Bouygues Telecom
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import etag from 'etag'
import Asset from '../assets/Asset'
import AssetComparator from '../assets/AssetComparator'
import AssetNameParser from '../assets/AssetNameParser'
import AssetNameSerializer from '../assets/AssetNameSerializer'
import AssetPredicate from '../assets/AssetPredicate'
import { allStoredAssets } from '../datasource/datasource'
import { VOLUME_MOUNT_PATH } from '../helpers/Env'
import { isCssURI, isJsURI, minifyCSS, minifyJS, resolveNonMinifiedURI } from '../helpers/Minify'
import { readFile } from '../helpers/File'
import { isVersionPreciseEnough } from '../helpers/Version'

/**
 * Given a requested asset, find out what locally available asset best matches the request.
 */
function findBestMatchingCandidate(r: NginxHTTPRequest, requestedAsset: Asset): Asset {
  const assetNameParser = new AssetNameParser()
  const assetComparator = new AssetComparator()
  const assetPredicate = new AssetPredicate(requestedAsset)

  const all = allStoredAssets(r)
  const assets = all.map((p) => p.name).map((name) => assetNameParser.parseFromStorageName(name))

  const eligibleAssetNamesOrdered = assets
    // only grab assets whose name correspond
    .filter((p) => p.name === requestedAsset.name)
    // order by version
    .sort(assetComparator.compare)

  const candidates = eligibleAssetNamesOrdered
    // filter matching asset versions and take the first result
    .filter((asset) => assetPredicate.matches(asset))

  const bestMatch = candidates[0]

  if (bestMatch) {
    r.log(`Found best match: ${JSON.stringify(bestMatch)}`)
    return bestMatch
  } else {
    r.warn('Did not find best match')
  }
}

/**
 * Given a requested asset (that can have a path) and a best matching candidate asset (that may have a default path),
 * find out what the final target URI is.
 */
function computeUriPath(r: NginxHTTPRequest, requestedAsset: Asset, candidateAsset: Asset): string {
  const assetNameSerializer = new AssetNameSerializer()
  const assetStorageName = assetNameSerializer.serializeAssetName(candidateAsset)
  const all = allStoredAssets(r)

  const defaultPath = all.find((p) => p.name === assetStorageName)?.defaultPath

  const hasPath = Boolean(requestedAsset.path) || Boolean(defaultPath)

  if (!hasPath) {
    return ''
  }

  return `/${assetStorageName}${requestedAsset.path || `/${defaultPath}`}`
}

/**
 * Find out the path of a given asset
 */
function assetDefaultPath(r: NginxHTTPRequest, requestedAsset: Asset): string {
  if (!requestedAsset.name || !requestedAsset.version) {
    // cannot find an asset without these information
    return ''
  }

  return (
    // if found, grab its default path
    allStoredAssets(r)
      // find an exact match
      .find((p) => p.name === `${requestedAsset.name}@${requestedAsset.version}`)?.defaultPath ||
    // if no default path is set
    ''
  )
}

/**
 * Given a requested URI, expand it into a target URI to redirect to, that corresponds to the best match.
 * The expansion supports:
 * - auto-minification of not-already minified JS and CSS
 * - versioning
 * - default path
 * - CORS headers
 * - 404 response handling
 * - 302 response handling
 * - 200 response handling
 *
 * Optional: depends on the `serveFiles` boolean variable that can be set in the nginx configuration. (defaults to false)
 */
export default function expand(r: NginxHTTPRequest): void {
  r.log(`----- expand: ${r.uri} -----`)

  const isMinificationRequested = r.uri.toString().match(/\.min\.(?:js|mjs|css)$/)

  try {
    const assetNameParser = new AssetNameParser()
    const requestedAsset = assetNameParser.parseFromUrl(r.uri.toString())

    // The URI is either complete or needs a redirect
    const isVersionPrecise = isVersionPreciseEnough(requestedAsset)
    const isURIComplete = Boolean(requestedAsset.path && isVersionPrecise)
    const needsRedirect = !isURIComplete
    r.log('DEBUG: ' + JSON.stringify({ isVersionPrecise, needsRedirect, isURIComplete }))

    if (!needsRedirect) {
      // Handle minification cases
      if (isMinificationRequested) {
        r.log('Minification requested')

        let source: string | void = undefined
        try {
          source = readFile(r, `${VOLUME_MOUNT_PATH}${r.uri}`)
        } catch (e) {
          // ignore
        }

        if (source) {
          r.return(200, source)
        } else {
          try {
            const sourceFilePath = resolveNonMinifiedURI(r.uri.toString())
            source = readFile(r, `${VOLUME_MOUNT_PATH}${sourceFilePath}`)
          } catch (e) {
            // ignore
          }

          // minify
          let minified = (source || '').toString()
          if (isJsURI(r.uri.toString())) {
            minified = minifyJS(minified)
          } else if (isCssURI(r.uri.toString())) {
            minified = minifyCSS(minified)
          }

          r.headersOut['cache-tag'] = 'minified asset'
          r.headersOut.etag = etag(minified)

          r.return(200, minified)
        }
      }
      // This should not happen, as this nominal case is handled in `nginx.conf` with `try_files $uri`
      if (r.variables.serveFiles) {
        // return what's asked
        r.return(200, readFile(r, `${VOLUME_MOUNT_PATH}${r.uri}`) as string)
      } else {
        handleNotFound(r)
      }
      return
    }

    if (!isVersionPrecise) {
      const candidateAsset = findBestMatchingCandidate(r, requestedAsset) // <- this is it
      const newPath = computeUriPath(r, requestedAsset, candidateAsset)

      if (!newPath) {
        handleNotFound(r)
        return
      }

      redirectOrResolve(r, newPath)
    } else if (!requestedAsset.path) {
      const assetPath = assetDefaultPath(r, requestedAsset)

      if (!assetPath) {
        handleNotFound(r)
        return
      }

      const newPath = `/${requestedAsset.name}@${requestedAsset.version}/${assetPath}`

      redirectOrResolve(r, newPath)
    } else {
      handleNotFound(r)
    }
  } catch (e) {
    r.error(e)
    handleNotFound(r)
  }
}

const handleNotFound = (r: NginxHTTPRequest) => {
  r.warn('internal 404')
  r.internalRedirect('/404.html')
}

const redirectOrResolve = (r: NginxHTTPRequest, path: string) => {
  if (!!process.env.A7_CORS_ALL) {
    r.headersOut['access-control-allow-origin'] = '*'
    r.headersOut['access-control-allow-headers'] = '*'
  }

  if (!!process.env.A7_PATH_AUTO_RESOLVE) {
    r.log(`internal redirect: ${path}`)
    r.internalRedirect(path)
  } else {
    r.log(`302: ${path}`)
    r.return(302, path)
  }
}
