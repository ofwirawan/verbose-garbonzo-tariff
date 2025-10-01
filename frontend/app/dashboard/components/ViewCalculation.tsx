"use client";

import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

import { useEffect, useRef, useState } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardAction,
	CardDescription,
} from "@/components/ui/card";
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from "@/components/ui/select";

import { useRouter } from "next/navigation";

// notifications when history saved
import { toast } from "sonner"

// Country options
const countryOptions = [
	{ label: "Afghanistan", value: "AFG" },
	{ label: "Albania", value: "ALB" },
	{ label: "Algeria", value: "DZA" },
	{ label: "Andorra", value: "AND" },
	{ label: "Angola", value: "AGO" },
	{ label: "Antigua and Barbuda", value: "ATG" },
	{ label: "Argentina", value: "ARG" },
	{ label: "Armenia", value: "ARM" },
	{ label: "Australia", value: "AUS" },
	{ label: "Austria", value: "AUT" },
	{ label: "Azerbaijan", value: "AZE" },
	{ label: "Bahamas", value: "BHS" },
	{ label: "Bahrain", value: "BHR" },
	{ label: "Bangladesh", value: "BGD" },
	{ label: "Barbados", value: "BRB" },
	{ label: "Belarus", value: "BLR" },
	{ label: "Belgium", value: "BEL" },
	{ label: "Belize", value: "BLZ" },
	{ label: "Benin", value: "BEN" },
	{ label: "Bhutan", value: "BTN" },
	{ label: "Bolivia", value: "BOL" },
	{ label: "Bosnia and Herzegovina", value: "BIH" },
	{ label: "Botswana", value: "BWA" },
	{ label: "Brazil", value: "BRA" },
	{ label: "Brunei", value: "BRN" },
	{ label: "Bulgaria", value: "BGR" },
	{ label: "Burkina Faso", value: "BFA" },
	{ label: "Burundi", value: "BDI" },
	{ label: "Cabo Verde", value: "CPV" },
	{ label: "Cambodia", value: "KHM" },
	{ label: "Cameroon", value: "CMR" },
	{ label: "Canada", value: "CAN" },
	{ label: "Central African Republic", value: "CAF" },
	{ label: "Chad", value: "TCD" },
	{ label: "Chile", value: "CHL" },
	{ label: "China", value: "CHN" },
	{ label: "Colombia", value: "COL" },
	{ label: "Comoros", value: "COM" },
	{ label: "Congo", value: "COG" },
	{ label: "Congo (Democratic Republic)", value: "COD" },
	{ label: "Costa Rica", value: "CRI" },
	{ label: "Côte d'Ivoire", value: "CIV" },
	{ label: "Croatia", value: "HRV" },
	{ label: "Cuba", value: "CUB" },
	{ label: "Cyprus", value: "CYP" },
	{ label: "Czech Republic", value: "CZE" },
	{ label: "Denmark", value: "DNK" },
	{ label: "Djibouti", value: "DJI" },
	{ label: "Dominica", value: "DMA" },
	{ label: "Dominican Republic", value: "DOM" },
	{ label: "Ecuador", value: "ECU" },
	{ label: "Egypt", value: "EGY" },
	{ label: "El Salvador", value: "SLV" },
	{ label: "Equatorial Guinea", value: "GNQ" },
	{ label: "Eritrea", value: "ERI" },
	{ label: "Estonia", value: "EST" },
	{ label: "Eswatini", value: "SWZ" },
	{ label: "Ethiopia", value: "ETH" },
	{ label: "Fiji", value: "FJI" },
	{ label: "Finland", value: "FIN" },
	{ label: "France", value: "FRA" },
	{ label: "Gabon", value: "GAB" },
	{ label: "Gambia", value: "GMB" },
	{ label: "Georgia", value: "GEO" },
	{ label: "Germany", value: "DEU" },
	{ label: "Ghana", value: "GHA" },
	{ label: "Greece", value: "GRC" },
	{ label: "Grenada", value: "GRD" },
	{ label: "Guatemala", value: "GTM" },
	{ label: "Guinea", value: "GIN" },
	{ label: "Guinea-Bissau", value: "GNB" },
	{ label: "Guyana", value: "GUY" },
	{ label: "Haiti", value: "HTI" },
	{ label: "Honduras", value: "HND" },
	{ label: "Hungary", value: "HUN" },
	{ label: "Iceland", value: "ISL" },
	{ label: "India", value: "IND" },
	{ label: "Indonesia", value: "IDN" },
	{ label: "Iran", value: "IRN" },
	{ label: "Iraq", value: "IRQ" },
	{ label: "Ireland", value: "IRL" },
	{ label: "Israel", value: "ISR" },
	{ label: "Italy", value: "ITA" },
	{ label: "Jamaica", value: "JAM" },
	{ label: "Japan", value: "JPN" },
	{ label: "Jordan", value: "JOR" },
	{ label: "Kazakhstan", value: "KAZ" },
	{ label: "Kenya", value: "KEN" },
	{ label: "Kiribati", value: "KIR" },
	{ label: "Korea (North)", value: "PRK" },
	{ label: "Korea (South)", value: "KOR" },
	{ label: "Kuwait", value: "KWT" },
	{ label: "Kyrgyzstan", value: "KGZ" },
	{ label: "Laos", value: "LAO" },
	{ label: "Latvia", value: "LVA" },
	{ label: "Lebanon", value: "LBN" },
	{ label: "Lesotho", value: "LSO" },
	{ label: "Liberia", value: "LBR" },
	{ label: "Libya", value: "LBY" },
	{ label: "Liechtenstein", value: "LIE" },
	{ label: "Lithuania", value: "LTU" },
	{ label: "Luxembourg", value: "LUX" },
	{ label: "Madagascar", value: "MDG" },
	{ label: "Malawi", value: "MWI" },
	{ label: "Malaysia", value: "MYS" },
	{ label: "Maldives", value: "MDV" },
	{ label: "Mali", value: "MLI" },
	{ label: "Malta", value: "MLT" },
	{ label: "Marshall Islands", value: "MHL" },
	{ label: "Mauritania", value: "MRT" },
	{ label: "Mauritius", value: "MUS" },
	{ label: "Mexico", value: "MEX" },
	{ label: "Micronesia", value: "FSM" },
	{ label: "Moldova", value: "MDA" },
	{ label: "Monaco", value: "MCO" },
	{ label: "Mongolia", value: "MNG" },
	{ label: "Montenegro", value: "MNE" },
	{ label: "Morocco", value: "MAR" },
	{ label: "Mozambique", value: "MOZ" },
	{ label: "Myanmar", value: "MMR" },
	{ label: "Namibia", value: "NAM" },
	{ label: "Nauru", value: "NRU" },
	{ label: "Nepal", value: "NPL" },
	{ label: "Netherlands", value: "NLD" },
	{ label: "New Zealand", value: "NZL" },
	{ label: "Nicaragua", value: "NIC" },
	{ label: "Niger", value: "NER" },
	{ label: "Nigeria", value: "NGA" },
	{ label: "North Macedonia", value: "MKD" },
	{ label: "Norway", value: "NOR" },
	{ label: "Oman", value: "OMN" },
	{ label: "Pakistan", value: "PAK" },
	{ label: "Palau", value: "PLW" },
	{ label: "Palestine", value: "PSE" },
	{ label: "Panama", value: "PAN" },
	{ label: "Papua New Guinea", value: "PNG" },
	{ label: "Paraguay", value: "PRY" },
	{ label: "Peru", value: "PER" },
	{ label: "Philippines", value: "PHL" },
	{ label: "Poland", value: "POL" },
	{ label: "Portugal", value: "PRT" },
	{ label: "Qatar", value: "QAT" },
	{ label: "Romania", value: "ROU" },
	{ label: "Russia", value: "RUS" },
	{ label: "Rwanda", value: "RWA" },
	{ label: "Saint Kitts and Nevis", value: "KNA" },
	{ label: "Saint Lucia", value: "LCA" },
	{ label: "Saint Vincent and the Grenadines", value: "VCT" },
	{ label: "Samoa", value: "WSM" },
	{ label: "San Marino", value: "SMR" },
	{ label: "Sao Tome and Principe", value: "STP" },
	{ label: "Saudi Arabia", value: "SAU" },
	{ label: "Senegal", value: "SEN" },
	{ label: "Serbia", value: "SRB" },
	{ label: "Seychelles", value: "SYC" },
	{ label: "Sierra Leone", value: "SLE" },
	{ label: "Singapore", value: "SGP" },
	{ label: "Slovakia", value: "SVK" },
	{ label: "Slovenia", value: "SVN" },
	{ label: "Solomon Islands", value: "SLB" },
	{ label: "Somalia", value: "SOM" },
	{ label: "South Africa", value: "ZAF" },
	{ label: "South Sudan", value: "SSD" },
	{ label: "Spain", value: "ESP" },
	{ label: "Sri Lanka", value: "LKA" },
	{ label: "Sudan", value: "SDN" },
	{ label: "Suriname", value: "SUR" },
	{ label: "Sweden", value: "SWE" },
	{ label: "Switzerland", value: "CHE" },
	{ label: "Syria", value: "SYR" },
	{ label: "Taiwan", value: "TWN" },
	{ label: "Tajikistan", value: "TJK" },
	{ label: "Tanzania", value: "TZA" },
	{ label: "Thailand", value: "THA" },
	{ label: "Timor-Leste", value: "TLS" },
	{ label: "Togo", value: "TGO" },
	{ label: "Tonga", value: "TON" },
	{ label: "Trinidad and Tobago", value: "TTO" },
	{ label: "Tunisia", value: "TUN" },
	{ label: "Turkey", value: "TUR" },
	{ label: "Turkmenistan", value: "TKM" },
	{ label: "Tuvalu", value: "TUV" },
	{ label: "Uganda", value: "UGA" },
	{ label: "Ukraine", value: "UKR" },
	{ label: "United Arab Emirates", value: "ARE" },
	{ label: "United Kingdom", value: "GBR" },
	{ label: "United States", value: "USA" },
	{ label: "Uruguay", value: "URY" },
	{ label: "Uzbekistan", value: "UZB" },
	{ label: "Vanuatu", value: "VUT" },
	{ label: "Vatican City", value: "VAT" },
	{ label: "Venezuela", value: "VEN" },
	{ label: "Vietnam", value: "VNM" },
	{ label: "Yemen", value: "YEM" },
	{ label: "Zambia", value: "ZMB" },
	{ label: "Zimbabwe", value: "ZWE" },
];

// Product code options
const productOptions = [
	{ label: "Live Animals & Animal Products", value: "01-05_Animals" },
	{ label: "Vegetable Products", value: "06-14_Vegetables" },
	{ label: "Prepared Foodstuffs & Beverages", value: "16-24_Food" },
	{ label: "Mineral Products & Fuels", value: "25-27_Minerals" },
	{ label: "Chemical Products", value: "28-38_Chemicals" },
	{ label: "Plastics & Rubber", value: "39-40_Plastics" },
	{ label: "Hides, Skins & Leather", value: "41-43_Leather" },
	{ label: "Wood Products", value: "44-46_Wood" },
	{ label: "Pulp & Paper", value: "47-49_Paper" },
	{ label: "Textiles & Clothing", value: "50-63_Textiles" },
	{ label: "Footwear & Headgear", value: "64-67_Footwear" },
	{ label: "Stone, Glass & Ceramics", value: "68-70_Stone" },
	{ label: "Precious Metals & Stones", value: "71_Precious" },
	{ label: "Base Metals", value: "72-83_Metals" },
	{ label: "Machinery & Electronics", value: "84-85_Machinery" },
	{ label: "Transportation Equipment", value: "86-89_Vehicles" },
	{ label: "Optical & Medical Instruments", value: "90-92_Instruments" },
	{ label: "Arms & Ammunition", value: "93_Arms" },
	{
		label: "Miscellaneous Manufactured Articles",
		value: "94-96_Miscellaneous",
	},
	{ label: "Works of Art & Antiques", value: "97_Art" },
	{ label: "Services & Intangibles", value: "98_Services" },
];

// Type for calculation result
interface CalculationResult {
	ratePercent: number;
	duty: string;
	totalPayable: string;
}

const inputClass =
	"w-full min-w-[200px] h-12 min-h-[48px] border rounded px-3 py-2 focus:outline-none focus:ring-2 transition-all";

function CountryAutocomplete({
	label,
	value,
	setValue,
	options,
	id,
	error,
	setError,
	placeholder,
}: {
	label: string;
	value: string;
	setValue: (v: string) => void;
	options: { label: string; value: string }[];
	id: string;
	error: boolean;
	setError: (v: boolean) => void;
	placeholder?: string;
}) {
	const [focused, setFocused] = useState(false);

	const filtered = options.filter((opt) =>
		opt.label.toLowerCase().includes(value.toLowerCase())
	);

	function validateCountry(val: string) {
		const normalized = val.trim().toLowerCase();
		const found = options.some(
			(opt) => opt.label.trim().toLowerCase() === normalized
		);
		setError(!found && val.trim().length > 0);
	}

	return (
		<div className="relative flex flex-col">
			<label htmlFor={id} className="block text-sm font-medium mb-2">
				{label}
			</label>
			<input
				id={id}
				type="text"
				value={value}
				onChange={(e) => {
					setValue(e.target.value);
					validateCountry(e.target.value);
				}}
				onFocus={() => setFocused(true)}
				onBlur={() => setTimeout(() => setFocused(false), 100)}
				placeholder={placeholder}
				className={`${inputClass} ${error
					? "border-red-500 focus:ring-red-500"
					: "border-gray-300 focus:ring-black"
					}`}
				autoComplete="off"
			/>
			{focused && value && filtered.length > 0 && (
				<ul className="absolute top-full left-0 w-full border rounded bg-white mt-1 max-h-40 overflow-auto shadow z-10">
					{filtered.map((opt) => (
						<li
							key={opt.value}
							className="px-3 py-2 cursor-pointer hover:bg-black hover:text-white"
							onMouseDown={() => {
								setValue(opt.label);
								validateCountry(opt.label);
								setFocused(false);
							}}
						>
							{opt.label}
						</li>
					))}
				</ul>
			)}
			{error && (
				<span className="text-red-500 text-xs mt-1">
					Please enter a valid country.
				</span>
			)}
		</div>
	);
}

function useCountUp(target: number, duration: number = 1000) {
	const [value, setValue] = useState(0);

	useEffect(() => {
		let start = 0;
		let startTime: number | null = null;
		const step = (timestamp: number) => {
			if (!startTime) startTime = timestamp;
			const progress = Math.min((timestamp - startTime) / duration, 1);
			const current = start + (target - start) * progress;
			setValue(Number(current.toFixed(2)));
			if (progress < 1) {
				requestAnimationFrame(step);
			} else {
				setValue(Number(target.toFixed(2)));
			}
		};
		if (duration > 0) {
			requestAnimationFrame(step);
		} else {
			setValue(Number(target.toFixed(2)));
		}
		return () => setValue(0);
	}, [target, duration]);

	return value;
}

export function ViewCalculation() {
	const [importingCountryInput, setImportingCountryInput] = useState("");
	const [exportingCountryInput, setExportingCountryInput] = useState("");
	const [importingCountryError, setImportingCountryError] = useState(false);
	const [exportingCountryError, setExportingCountryError] = useState(false);
	// Added a transaction date for users & router
	const [transactionDate, setTransactionDate] = useState<string>("");
	const router = useRouter();
	// Added for the save history button
	const [canSaveHistory, setCanSaveHistory] = useState(false);
	// Added for dialog after saving
	const [isDialogOpen, setIsDialogOpen] = useState(false);


	const [productCode, setProductCode] = useState("01-05_Animals");
	const [productCost, setProductCost] = useState("");
	const [result, setResult] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [showResult, setShowResult] = useState(false);
	const resultRef = useRef<HTMLDivElement>(null);
	const [productWeight, setProductWeight] = useState<number | ''>('');


	const dutyCount = useCountUp(
		result ? Number(result.duty) : 0,
		result ? 1000 : 0
	);
	const totalPayableCount = useCountUp(
		result ? Number(result.totalPayable) : 0,
		result ? 1000 : 0
	);

	useEffect(() => {
		if (result) {
			setShowResult(false);
			const timer = setTimeout(() => setShowResult(true), 50);
			return () => clearTimeout(timer);
		}
		setShowResult(false);
	}, [result]);

	// Scroll to result when it appears
	useEffect(() => {
		if (showResult && resultRef.current) {
			resultRef.current.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}
	}, [showResult]);

	function findCountryValue(label: string) {
		const normalizedInput = label.trim().toLowerCase();
		const match = countryOptions.find(
			(opt) => opt.label.trim().toLowerCase() === normalizedInput
		);
		return match ? match.value : null;
	}

	// Handle Calculation only
	async function handleSubmit() {
		if (!importingCountryInput || !exportingCountryInput) {
			setError("Please enter valid countries.");
			return;
		}
		if (!productCost || Number(productCost) <= 0) {
			setError("Please enter a valid product cost.");
			return;
		}
		if (!transactionDate) {
			setError("Please select a transaction date.");
			return;
		}

		setError("");
		setIsLoading(true);
		setResult(null);

		try {
			// Mock delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const mockData: CalculationResult = {
				ratePercent: 5.25,
				duty: (Number(productCost) * 0.0525).toFixed(2),
				totalPayable: (Number(productCost) * 1.0525).toFixed(2),
			};

			setResult(mockData);

			// Enable Save button after calculation
			setCanSaveHistory(true);

		} catch (err: any) {
			console.error(err);
			setError("Calculation failed.");
		} finally {
			setIsLoading(false);
		}
	}

	// Separate Save History
	async function handleSaveHistory() {
		if (!result) return;

		try {
			const formattedDate = new Date(transactionDate).toISOString().split("T")[0];
			const requestBody = {
				date: formattedDate,
				product: productOptions.find(p => p.value === productCode)?.label || "Your Product",
				weight: Number(productWeight),
				route: `${exportingCountryInput} → ${importingCountryInput}`,
				tradeValue: Number(productCost),
				tariffRate: result.ratePercent,
				tariffCost: Number(result.duty),
			};

			const response = await fetch("http://localhost:8080/api/history", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) throw new Error("Failed to save history");

			console.log("Saved history successfully:", await response.json());
			setCanSaveHistory(false); // disable after save

			// ✅ Show alert
			toast.success("Saved Successfully!");
		} catch (err) {
			console.error(err);
			toast.error("Calculation done but failed to save history.");
		}
	}



	// async function handleSubmit() {
	// 	const importingCountry = findCountryValue(importingCountryInput);
	// 	const exportingCountry = findCountryValue(exportingCountryInput);

	// 	if (!importingCountry || !exportingCountry) {
	// 		setError("Please enter valid countries.");
	// 		return;
	// 	}
	// 	if (importingCountry === exportingCountry) {
	// 		setError("Importing and exporting countries cannot be the same.");
	// 		return;
	// 	}
	// 	if (!productCost || Number(productCost) <= 0) {
	// 		setError("Please enter a valid product cost.");
	// 		return;
	// 	}

	// 	setError(""); // Clear error only on successful validation
	// 	setIsLoading(true);
	// 	setResult(null);

	// 	try {
	// 		const res = await fetch("http://localhost:8080/api/calculate", {
	// 			method: "POST",
	// 			headers: { "Content-Type": "application/json" },
	// 			body: JSON.stringify({
	// 				reporter: importingCountry,
	// 				partner: exportingCountry,
	// 				hs6: productCode,
	// 				tradeValue: Number(productCost),
	// 				transactionDate: new Date().toISOString(),
	// 			}),
	// 		});
	// 		if (!res.ok) {
	// 			let errMsg = "Calculation failed";
	// 			try {
	// 				const json = await res.json();
	// 				errMsg = json.message || errMsg;
	// 			} catch {}
	// 			throw new Error(errMsg);
	// 		}
	// 		const data = await res.json();
	// 		setResult(data);
	// 	} catch (err: any) {
	// 		setError(err.message);
	// 	} finally {
	// 		setIsLoading(false);
	// 	}
	// }

	/* Mock function for testing without backend
		async function handleSubmit() {
			if (!importingCountryInput || !exportingCountryInput) {
				setError("Please enter valid countries.");
				return;
			}
			if (!productCost || Number(productCost) <= 0) {
				setError("Please enter a valid product cost.");
				return;
			}
	
			setError("");
			setIsLoading(true);
			setResult(null);
	
			try {
				// Simulated delay to mimic API call
				await new Promise((resolve) => setTimeout(resolve, 1000));
	
				// Mock response data
				const mockData = {
					ratePercent: 5.25,
					duty: (Number(productCost) * 0.0525).toFixed(2),
					totalPayable: (Number(productCost) * 1.0525).toFixed(2),
				};
	
				setResult(mockData);
			} catch (err: any) {
				setError("Mock calculation failed.");
			} finally {
				setIsLoading(false);
			}
		}
	*/
	const isCalculateDisabled =
		importingCountryError ||
		exportingCountryError ||
		!importingCountryInput.trim() ||
		!exportingCountryInput.trim() ||
		!productCost ||
		Number(productCost) <= 0;

	return (
		<div className="max-w-6xl mx-auto">
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl font-bold">
						Tariff Calculation
					</CardTitle>
					<CardDescription>
						Calculate tariffs for a product between two countries.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 w-full">
						<CountryAutocomplete
							label="Importing Country (Sets Tariffs):"
							value={importingCountryInput}
							setValue={setImportingCountryInput}
							options={countryOptions}
							id="importingCountry"
							error={importingCountryError}
							setError={setImportingCountryError}
							placeholder="Type to search country"
						/>
						<CountryAutocomplete
							label="Exporting Country (Pays Tariffs):"
							value={exportingCountryInput}
							setValue={setExportingCountryInput}
							options={countryOptions}
							id="exportingCountry"
							error={exportingCountryError}
							setError={setExportingCountryError}
							placeholder="Type to search country"
						/>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 w-full">
						<div className="flex flex-col">
							<label
								htmlFor="productCode"
								className="block text-sm font-medium mb-2"
							>
								Product Category:
							</label>
							<Select
								value={productCode}
								onValueChange={setProductCode}
							>
								<SelectTrigger
									className={`${inputClass} border-gray-300 focus:ring-black flex items-center`}
									aria-label="Select product category"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{productOptions.map((p) => (
										<SelectItem
											key={p.value}
											value={p.value}
										>
											{p.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col">
							<label
								htmlFor="productCost"
								className="block text-sm font-medium mb-2"
							>
								Product Cost (Trade Value):
							</label>
							<input
								id="productCost"
								type="number"
								min="0"
								value={productCost}
								onChange={(e) => setProductCost(e.target.value)}
								className={`${inputClass} border-gray-300 focus:ring-black`}
								placeholder="Enter cost"
							/>
						</div>

						<div className="flex flex-col">
							<label className="block text-sm font-medium mb-2">Transaction Date:</label>
							<input
								type="date"
								value={transactionDate}
								onChange={(e) => setTransactionDate(e.target.value)}
								className={`${inputClass} border-gray-300 focus:ring-black`}
							/>
						</div>

						<div className="flex flex-col">
							<label
								htmlFor="productWeight"
								className="block text-sm font-medium mb-2"
							>
								Product Weight (in kg):
							</label>
							<input
								id="productWeight"
								type="number"
								min="0"
								step="0.01"
								value={Number.isNaN(productWeight) ? "" : productWeight}
								onChange={(e) => setProductWeight(parseFloat(e.target.value))}
								className={`${inputClass} border-gray-300 focus:ring-black`}
								placeholder="Enter weight"
							/>
						</div>
					</div>
					<div className="flex justify-center mt-6">
						<button
							onClick={handleSubmit}
							disabled={isCalculateDisabled || isLoading}
							className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-50 font-semibold text-base"
						>
							{isLoading ? "Calculating..." : "Calculate"}
						</button>
					</div>
					{error && (
						<div className="text-red-500 text-center py-2">
							{error}
						</div>
					)}
					{result && (
						<CardContent>
							<div
								ref={resultRef}
								className={`transition-opacity duration-700 ${showResult ? "opacity-100" : "opacity-0"
									}`}
							>
								<h3 className="text-lg font-bold underline mb-4">
									Calculation Result
								</h3>
								<div className="space-y-2">
									<p className="flex items-center gap-2">
										<strong>Tariff Rate:</strong>{" "}
										{result.ratePercent}%
									</p>
									<p className="flex items-center gap-2">
										<strong>Duty:</strong>{" "}
										<span className="count-up">
											{dutyCount}
										</span>
									</p>
									<div className="flex items-center justify-between">
										<strong>Total Payable:</strong>
										<span className="font-bold text-lg text-green-700 bg-green-100 px-4 py-1 rounded text-right count-up min-w-[120px] text-end">
											{totalPayableCount}
										</span>
									</div>

									<AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
										<AlertDialogTrigger asChild>
											<Button
												disabled={!canSaveHistory}
												variant="default"
											>
												Save History
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Confirm Save</AlertDialogTitle>
												<AlertDialogDescription>
													You are about to save this calculation to history.
													Are you sure you want to continue?
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter className="flex gap-2">
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<Button
													variant="default"
													onClick={async () => {
														await handleSaveHistory();
														setIsDialogOpen(false); // manually close the dialog
													}}
												>
													Yes, Save it
												</Button>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>

								</div>
							</div>
						</CardContent>
					)}
				</CardContent>
			</Card>

			<button
				onClick={() => router.push("/history")}
				className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
			>
				View History
			</button>
		</div>
	);
}
