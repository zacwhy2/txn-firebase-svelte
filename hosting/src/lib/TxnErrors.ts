export default class TxnErrors {
  amount = false
  from = false
  to = false
  description = false
  date = false

  reset() {
    this.amount = false
    this.from = false
    this.to = false
    this.description = false
    this.date = false
  }

  validate(txn?: { amount?: any; from?: any; to?: any; description?: any; date?: any } | null): boolean {
    this.amount = !txn || !txn.amount
    this.from = !txn || !txn.from
    this.to = !txn || !txn.to
    this.description = !txn || !txn.description
    this.date = !txn || !txn.date
    return this.hasErrors()
  }

  hasErrors(): boolean {
    return this.amount || this.from || this.to || this.description || this.date
  }
}
