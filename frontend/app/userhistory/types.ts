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
    // New fields from enhanced History model
    freightCost?: number
    freightType?: string
    insuranceRate?: number
    insuranceCost?: number
    totalLandedCost?: number
    user?: unknown
    warnings?: any // Add warnings field to handle JsonNode
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
    // New fields for enhanced display
    freightCost?: number
    freightType?: string
    insuranceRate?: number
    insuranceCost?: number
    totalLandedCost?: number
    tradeFinal?: number
    warnings?: string[] // Add warnings field to display
}

// Transform backend data to frontend format
export function transformTransactionToHistoryItem(transaction: BackendTransaction): HistoryItem {
    const importerCode = transaction.importer?.countryCode || 'N/A'
    const exporterCode = transaction.exporter?.countryCode

    // Handle warnings - backend stores as JsonNode, convert to string array
    let warnings: string[] = [];
    if (transaction.warnings) {
        if (Array.isArray(transaction.warnings)) {
            warnings = transaction.warnings;
        } else if (typeof transaction.warnings === 'object' && transaction.warnings !== null) {
            // Handle JsonNode case - extract array from JSON structure
            warnings = Array.isArray((transaction.warnings as any)) ? (transaction.warnings as any) : [];
        }
    }

    return {
        id: transaction.tid,
        date: transaction.tDate,
        product: transaction.product?.hs6Code || 'N/A',
        route: exporterCode ? `${exporterCode} → ${importerCode}` : importerCode,
        tradeValue: transaction.tradeOriginal,
        tariffRate: transaction.appliedRate?.rate || 0,
        tariffCost: transaction.tradeFinal - transaction.tradeOriginal,
        weight: transaction.netWeight || null,
        appliedRate: transaction.appliedRate,
        // Map new fields
        freightCost: transaction.freightCost,
        freightType: transaction.freightType,
        insuranceRate: transaction.insuranceRate,
        insuranceCost: transaction.insuranceCost,
        totalLandedCost: transaction.totalLandedCost,
        tradeFinal: transaction.tradeFinal,
        warnings: warnings
    }
}
