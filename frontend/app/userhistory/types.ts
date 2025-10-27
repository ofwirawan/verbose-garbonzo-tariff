// Applied rate structure
export interface AppliedRate {
    rate?: number
    suspension?: number
    prefAdval?: number
    mfnAdval?: number
    specific?: number
}

// Backend Transaction model structure
export interface BackendTransaction {
    tid: number
    tDate: string
    product: {
        hs6Code: string
        description?: string
    }
    importer: {
        countryCode: string
        name: string
    }
    exporter?: {
        countryCode: string
        name: string
    }
    tradeOriginal: number
    tradeFinal: number
    netWeight?: number
    appliedRate?: AppliedRate
    user?: unknown
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
    weight: number | null
    appliedRate?: AppliedRate
}

// Transform backend data to frontend format
export function transformTransactionToHistoryItem(transaction: BackendTransaction): HistoryItem {
    const importerCode = transaction.importer?.countryCode || 'N/A'
    const exporterCode = transaction.exporter?.countryCode

    return {
        id: transaction.tid,
        date: transaction.tDate,
        product: transaction.product?.hs6Code || 'N/A',
        route: exporterCode ? `${exporterCode} → ${importerCode}` : importerCode,
        tradeValue: transaction.tradeOriginal,
        tariffRate: transaction.appliedRate?.rate || 0,
        tariffCost: transaction.tradeFinal - transaction.tradeOriginal,
        weight: transaction.netWeight || null,
        appliedRate: transaction.appliedRate
    }
}
