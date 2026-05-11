declare module 'xlsx-populate' {
  interface Cell {
    value(): unknown
    value(val: string | number | boolean | null): Cell
  }
  interface Sheet {
    cell(address: string): Cell
    name(): string
  }
  interface Workbook {
    sheet(name: string): Sheet | undefined
    outputAsync(): Promise<Buffer>
  }
  const XlsxPopulate: {
    fromDataAsync(data: Buffer | ArrayBuffer | Uint8Array): Promise<Workbook>
  }
  export = XlsxPopulate
}
