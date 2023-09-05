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

/**
 * Hash a string
 * @param input string to hash
 */
export function hash(input: string): string {
  let resultHash = 0
  for (let i = 0; i < input.length; i++) {
    const currentCharCode = input.charCodeAt(i)
    resultHash = (resultHash << 5) - resultHash + currentCharCode
    resultHash |= 0 // Convert to 32bit integer
  }
  return resultHash.toString()
}

/**
 * We have to reimplement the localeCompare function because it is not available in NJS.
 * @param str1 String
 * @param str2 String
 * @returns -1, 0, 1
 */
export function localeCompare(str1: string | undefined, str2: string | undefined) {
  if (str1 === undefined && str2 === undefined) {
    return 0
  }

  if (str1 === undefined) {
    return 1
  }

  if (str2 === undefined) {
    return -1
  }

  const minLength = Math.min(str1.length, str2.length)

  for (let i = 0; i < minLength; i++) {
    const char1 = str1.charCodeAt(i)
    const char2 = str2.charCodeAt(i)

    if (char1 < char2) {
      return -1
    } else if (char1 > char2) {
      return 1
    }
  }

  if (str1.length < str2.length) {
    return -1
  } else if (str1.length > str2.length) {
    return 1
  }

  return 0
}
