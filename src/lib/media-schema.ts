export function missingRpc(message: string) {
  return /could not find the function|PGRST202/i.test(message)
}

export function missingColumn(message: string) {
  return /could not find the '.+' column|42703|column .+ does not exist/i.test(message)
}
