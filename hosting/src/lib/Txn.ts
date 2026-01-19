export default class Txn {
  id?: string
  date: string
  amount?: number
  from?: string
  to?: string
  description?: string

  constructor(data?: Partial<Txn>) {
    this.id = data?.id
    this.date = data?.date ?? new Date().toLocaleDateString('en-CA')
    this.amount = data?.amount
    this.from = data?.from
    this.to = data?.to
    this.description = data?.description
  }

  toFirestore() {
    return {
      date: this.date,
      amount: this.amount,
      from: this.from,
      to: this.to,
      description: this.description,
    }
  }
}
