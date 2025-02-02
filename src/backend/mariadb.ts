import {
  type Pool,
  type PoolConnection,
  type RowDataPacket,
  type ResultSetHeader,
  createPool,
} from 'mysql2/promise'
import config from '../utils/config'

let database: Database | null = null

export function getMariaDB() {
  if (database === null) {
    database = new Database(createPool(config.MYSQL_URI))
  }
  return database
}

export class Database {
  private state: DatabaseState
  private pool: Pool

  constructor(pool: Pool) {
    this.pool = pool
    this.state = { type: 'OutsideOfTransaction' }
  }

  public async beginTransaction() {
    if (this.state.type === 'OutsideOfTransaction') {
      const transaction = await this.pool.getConnection()
      await transaction.beginTransaction()

      this.state = { type: 'InsideTransaction', transaction }
    } else {
      const { transaction } = this.state
      const newDepth =
        this.state.type === 'InsideSavepoint' ? this.state.depth + 1 : 0

      await transaction.query(`SAVEPOINT _savepoint_${newDepth}`)

      this.state = { type: 'InsideSavepoint', transaction, depth: newDepth }
    }

    let isComittedOrRollbacked = false

    return {
      commit: async () => {
        if (!isComittedOrRollbacked) {
          await this.commitLastTransaction()
          isComittedOrRollbacked = true
        }
      },
      rollback: async () => {
        if (!isComittedOrRollbacked) {
          await this.rollbackLastTransaction()
          isComittedOrRollbacked = true
        }
      },
    }
  }

  private async commitLastTransaction() {
    if (this.state.type === 'OutsideOfTransaction') return

    const { transaction } = this.state

    if (this.state.type === 'InsideTransaction') {
      await transaction.commit()
      transaction.release()

      this.state = { type: 'OutsideOfTransaction' }
    } else {
      const { depth } = this.state

      await transaction.query(`RELEASE SAVEPOINT _savepoint_${depth}`)

      this.state =
        depth > 0
          ? { type: 'InsideSavepoint', transaction, depth: depth - 1 }
          : { type: 'InsideTransaction', transaction }
    }
  }

  private async rollbackLastTransaction() {
    if (this.state.type === 'OutsideOfTransaction') return

    const { transaction } = this.state

    if (this.state.type === 'InsideTransaction') {
      await this.rollbackAllTransactions()
    } else {
      const { depth } = this.state

      await transaction.query(`ROLLBACK TO SAVEPOINT _savepoint_${depth}`)

      this.state =
        depth > 0
          ? { type: 'InsideSavepoint', transaction, depth: depth - 1 }
          : { type: 'InsideTransaction', transaction }
    }
  }

  public async rollbackAllTransactions() {
    if (this.state.type === 'OutsideOfTransaction') return

    const { transaction } = this.state

    await transaction.rollback()
    transaction.release()

    this.state = { type: 'OutsideOfTransaction' }
  }

  public async fetchAll<T = unknown>(
    sql: string,
    params?: unknown[]
  ): Promise<T[]> {
    return this.execute<(T & RowDataPacket)[]>(sql, params)
  }

  public async fetchOptional<T = unknown>(
    sql: string,
    params?: unknown[]
  ): Promise<T | null> {
    const [result] = await this.execute<(T & RowDataPacket)[]>(sql, params)

    return result ?? null
  }

  public async fetchOne<T = unknown>(
    sql: string,
    params?: unknown[]
  ): Promise<T> {
    const result = await this.fetchOptional<T>(sql, params)

    if (result == null) throw new Error('Expected one row, no row found')

    return result
  }

  public async mutate(
    sql: string,
    params?: unknown[]
  ): Promise<ResultSetHeader> {
    return this.execute<ResultSetHeader>(sql, params)
  }

  public async close() {
    await this.pool.end()
  }

  private async execute<T extends RowDataPacket[] | ResultSetHeader>(
    sql: string,
    params?: unknown[]
  ): Promise<T> {
    const numberOfTries = 10
    const waitTime = 1000
    for (let i = 0; i < numberOfTries; i++) {
      try {
        if (this.state.type === 'OutsideOfTransaction') {
          const [rows] = await this.pool.execute<T>(sql, params)

          return rows
        } else {
          const [rows] = await this.state.transaction.execute<T>(sql, params)

          return rows
        }
      } catch {
        await new Promise((res) => setTimeout(res, waitTime))
      }
    }
    throw new Error(
      `Failed to execute command in mariadb database after ${numberOfTries} tries.`
    )
  }
}

type DatabaseState = OutsideOfTransaction | InsideTransaction | InsideSavepoint

interface OutsideOfTransaction {
  type: 'OutsideOfTransaction'
}

interface InsideTransaction {
  type: 'InsideTransaction'
  transaction: PoolConnection
}

interface InsideSavepoint {
  type: 'InsideSavepoint'
  transaction: PoolConnection
  depth: number
}
