export function interleave<T>(arr1: T[], arr2: T[]): T[] {
  const finalArr: T[] = []
  const loopCount = Math.max(arr1.length, arr2.length)
  for (let i = 0; i < loopCount; i++) {
    if (i < arr1.length) finalArr.push(arr1[i])
    if (i < arr2.length) finalArr.push(arr2[i])
  }
  return finalArr
}
