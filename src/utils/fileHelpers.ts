// src/utils/fileHelpers.ts
export async function dataURLtoFile(
  dataurl: string,
  filename: string
): Promise<File> {
  const res = await fetch(dataurl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}
