// Backend Transaction model structure
export interface BackendTransaction {
    tid: number
    tDate: string
    hs6code: string
    importerCode: string
    exporterCode?: string
    tradeOriginal: number
    tradeFinal: number
    netWeight?: number
    appliedRate?: any
    uid: string
}

// Frontend display structure
export interface HistoryItem {
    id: number
    date: string
    product: string
    route: string
    tradeValue: number
    tariffRate: number
    tariffCost: number
}

// Transform backend data to frontend format
export function transformTransactionToHistoryItem(transaction: BackendTransaction): HistoryItem {
    return {
        id: transaction.tid,
        date: transaction.tDate,
        product: transaction.hs6code,
        route: `${transaction.importerCode}${transaction.exporterCode ? ` → ${transaction.exporterCode}` : ''}`,
        tradeValue: transaction.tradeOriginal,
        tariffRate: transaction.appliedRate?.rate || 0,
        tariffCost: transaction.tradeFinal - transaction.tradeOriginal
    }
}
