import Asset from '../assets/Asset'
// import { A7_CORS_ALL, A7_PATH_AUTO_RESOLVE, PUBLIC_ORIGIN } from './Env'
// import { isCssURI, isJsURI, isMinificationRequested, resolveMinifiedURI, resolveNonMinifiedURI } from './Minify'

export enum FileAccessMode {
  SERVE_RAW_FILE = 'raw',
  SERVE_COMPUTED_MINIFIED = 'minified',
}

/**
 * Add a leading comment to an existing source code.
 * @param r Request
 * @param asset Asset
 * @param source Source
 * @param fileAccessMode File access mode
 * @returns Source code with leading comment
 */
export const commentedSource = (
  r: NginxHTTPRequest,
  asset: Asset,
  source: string,
  fileAccessMode: `${FileAccessMode}`
): NjsStringLike => {
  return source

  /**
   * Adding this comment to the file triggers an error when trying to download packages from the ui
   * Probably because it modifies the file length and doesn't anymore the size set in the .directory.txt
   * */

  //   const isCommentable = isCssURI(r.uri.toString()) || isJsURI(r.uri.toString())

  //   if (!isCommentable) {
  //     return source
  //   }

  //   let comment = ''
  //   switch (fileAccessMode) {
  //     case 'minified':
  //       comment = 'This asset is generated.'
  //       break
  //     case 'raw':
  //       comment = 'This asset is served as-is.'
  //       break
  //   }

  //   const publicURI = `${PUBLIC_ORIGIN}/${asset.name}@${asset.version}${asset.path}`
  //   const nonMinifiedURI = resolveNonMinifiedURI(publicURI)
  //   const minifiedURI = resolveMinifiedURI(nonMinifiedURI)

  //   const isMinURI = isMinificationRequested(publicURI)
  //   const pinnedURLs = `
  //  * Pinned URL: (Optimized for Production)
  //  *   ▶️ Normal:   ${publicURI}${
  //     !isMinURI
  //       ? `
  //  *   ⏩ Minified: ${minifiedURI}`
  //       : ''
  //   }`

  //   comment = `/*
  //  * A7 - ${asset.name}@${asset.version}
  //  *
  //  * ${comment}
  //  * ${pinnedURLs}
  //  *
  //  * Details:
  //  *   👮 CORS:  ${A7_CORS_ALL ? '✅ can be requested from any origin' : '⚠️ can be requested from restricted origins'}
  //  *   💁 Asset resolution:  ${A7_PATH_AUTO_RESOLVE ? 'resolve and serve' : 'client-side redirect'}
  //  *
  //  */

  // `
  //   return `${comment}${source}`
}
