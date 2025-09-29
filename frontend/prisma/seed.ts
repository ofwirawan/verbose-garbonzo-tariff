// Prisma seed script for countries and products tables using WITS data
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Complete WITS ISO3 country codes and names from CSV data
const countries = [
  { country_code: "ABW", name: "Aruba", numeric_code: "533" },
  { country_code: "AFG", name: "Afghanistan", numeric_code: "004" },
  { country_code: "AGO", name: "Angola", numeric_code: "024" },
  { country_code: "AIA", name: "Anguila", numeric_code: "660" },
  { country_code: "ALB", name: "Albania", numeric_code: "008" },
  { country_code: "AND", name: "Andorra", numeric_code: "020" },
  { country_code: "ANT", name: "Netherlands Antilles", numeric_code: "530" },
  { country_code: "ARE", name: "United Arab Emirates", numeric_code: "784" },
  { country_code: "ARG", name: "Argentina", numeric_code: "032" },
  { country_code: "ARM", name: "Armenia", numeric_code: "051" },
  { country_code: "ATG", name: "Antigua and Barbuda", numeric_code: "028" },
  { country_code: "AUS", name: "Australia", numeric_code: "036" },
  { country_code: "AUT", name: "Austria", numeric_code: "040" },
  { country_code: "AZE", name: "Azerbaijan", numeric_code: "031" },
  { country_code: "BDI", name: "Burundi", numeric_code: "108" },
  { country_code: "BEN", name: "Benin", numeric_code: "204" },
  { country_code: "BFA", name: "Burkina Faso", numeric_code: "854" },
  { country_code: "BGD", name: "Bangladesh", numeric_code: "050" },
  { country_code: "BGR", name: "Bulgaria", numeric_code: "100" },
  { country_code: "BHR", name: "Bahrain", numeric_code: "048" },
  { country_code: "BHS", name: "Bahamas, The", numeric_code: "044" },
  { country_code: "BIH", name: "Bosnia and Herzegovina", numeric_code: "070" },
  { country_code: "BLR", name: "Belarus", numeric_code: "112" },
  { country_code: "BLZ", name: "Belize", numeric_code: "084" },
  { country_code: "BMU", name: "Bermuda", numeric_code: "060" },
  { country_code: "BOL", name: "Bolivia", numeric_code: "068" },
  { country_code: "BRA", name: "Brazil", numeric_code: "076" },
  { country_code: "BRB", name: "Barbados", numeric_code: "052" },
  { country_code: "BRN", name: "Brunei", numeric_code: "096" },
  { country_code: "BTN", name: "Bhutan", numeric_code: "064" },
  { country_code: "BWA", name: "Botswana", numeric_code: "072" },
  {
    country_code: "CAF",
    name: "Central African Republic",
    numeric_code: "140",
  },
  { country_code: "CAN", name: "Canada", numeric_code: "124" },
  { country_code: "CHE", name: "Switzerland", numeric_code: "756" },
  { country_code: "CHL", name: "Chile", numeric_code: "152" },
  { country_code: "CHN", name: "China", numeric_code: "156" },
  { country_code: "CIV", name: "Cote d'Ivoire", numeric_code: "384" },
  { country_code: "CMR", name: "Cameroon", numeric_code: "120" },
  { country_code: "COG", name: "Congo, Rep.", numeric_code: "178" },
  { country_code: "COK", name: "Cook Islands", numeric_code: "184" },
  { country_code: "COL", name: "Colombia", numeric_code: "170" },
  { country_code: "COM", name: "Comoros", numeric_code: "174" },
  { country_code: "CPV", name: "Cape Verde", numeric_code: "132" },
  { country_code: "CRI", name: "Costa Rica", numeric_code: "188" },
  { country_code: "CSK", name: "Czechoslovakia", numeric_code: "200" },
  { country_code: "CUB", name: "Cuba", numeric_code: "192" },
  { country_code: "CYP", name: "Cyprus", numeric_code: "196" },
  { country_code: "CZE", name: "Czech Republic", numeric_code: "203" },
  { country_code: "DJI", name: "Djibouti", numeric_code: "262" },
  { country_code: "DMA", name: "Dominica", numeric_code: "212" },
  { country_code: "DOM", name: "Dominican Republic", numeric_code: "214" },
  { country_code: "DZA", name: "Algeria", numeric_code: "012" },
  { country_code: "ECU", name: "Ecuador", numeric_code: "218" },
  { country_code: "EGY", name: "Egypt, Arab Rep.", numeric_code: "818" },
  { country_code: "ERI", name: "Eritrea", numeric_code: "232" },
  { country_code: "EST", name: "Estonia", numeric_code: "233" },
  {
    country_code: "ETH",
    name: "Ethiopia(excludes Eritrea)",
    numeric_code: "231",
  },
  { country_code: "EUN", name: "European Union", numeric_code: "918" },
  { country_code: "FIN", name: "Finland", numeric_code: "246" },
  { country_code: "FJI", name: "Fiji", numeric_code: "242" },
  { country_code: "FRO", name: "Faeroe Islands", numeric_code: "234" },
  { country_code: "GAB", name: "Gabon", numeric_code: "266" },
  { country_code: "GAZ", name: "Gaza Strip", numeric_code: "274" },
  { country_code: "GBR", name: "United Kingdom", numeric_code: "826" },
  { country_code: "GEO", name: "Georgia", numeric_code: "268" },
  { country_code: "GHA", name: "Ghana", numeric_code: "288" },
  { country_code: "GIN", name: "Guinea", numeric_code: "324" },
  { country_code: "GMB", name: "Gambia, The", numeric_code: "270" },
  { country_code: "GNB", name: "Guinea-Bissau", numeric_code: "624" },
  { country_code: "GNQ", name: "Equatorial Guinea", numeric_code: "226" },
  { country_code: "GRD", name: "Grenada", numeric_code: "308" },
  { country_code: "GRL", name: "Greenland", numeric_code: "304" },
  { country_code: "GTM", name: "Guatemala", numeric_code: "320" },
  { country_code: "GUF", name: "French Guiana", numeric_code: "254" },
  { country_code: "GUY", name: "Guyana", numeric_code: "328" },
  { country_code: "HKG", name: "Hong Kong, China", numeric_code: "344" },
  { country_code: "HND", name: "Honduras", numeric_code: "340" },
  { country_code: "HRV", name: "Croatia", numeric_code: "191" },
  { country_code: "HTI", name: "Haiti", numeric_code: "332" },
  { country_code: "HUN", name: "Hungary", numeric_code: "348" },
  { country_code: "IDN", name: "Indonesia", numeric_code: "360" },
  { country_code: "IND", name: "India", numeric_code: "356" },
  { country_code: "IRN", name: "Iran, Islamic Rep.", numeric_code: "364" },
  { country_code: "IRQ", name: "Iraq", numeric_code: "368" },
  { country_code: "ISL", name: "Iceland", numeric_code: "352" },
  { country_code: "ISR", name: "Israel", numeric_code: "376" },
  { country_code: "JAM", name: "Jamaica", numeric_code: "388" },
  { country_code: "JOR", name: "Jordan", numeric_code: "400" },
  { country_code: "JPN", name: "Japan", numeric_code: "392" },
  { country_code: "KAZ", name: "Kazakhstan", numeric_code: "398" },
  { country_code: "KEN", name: "Kenya", numeric_code: "404" },
  { country_code: "KGZ", name: "Kyrgyz Republic", numeric_code: "417" },
  { country_code: "KHM", name: "Cambodia", numeric_code: "116" },
  { country_code: "KNA", name: "St. Kitts and Nevis", numeric_code: "659" },
  { country_code: "KOR", name: "Korea, Rep.", numeric_code: "410" },
  { country_code: "KWT", name: "Kuwait", numeric_code: "414" },
  { country_code: "LAO", name: "Lao PDR", numeric_code: "418" },
  { country_code: "LBN", name: "Lebanon", numeric_code: "422" },
  { country_code: "LBR", name: "Liberia", numeric_code: "430" },
  { country_code: "LBY", name: "Libya", numeric_code: "434" },
  { country_code: "LCA", name: "St. Lucia", numeric_code: "662" },
  { country_code: "LIE", name: "Liechtenstein", numeric_code: "438" },
  { country_code: "LKA", name: "Sri Lanka", numeric_code: "144" },
  { country_code: "LSO", name: "Lesotho", numeric_code: "426" },
  { country_code: "LTU", name: "Lithuania", numeric_code: "440" },
  { country_code: "LVA", name: "Latvia", numeric_code: "428" },
  { country_code: "MAC", name: "Macao", numeric_code: "446" },
  { country_code: "MAR", name: "Morocco", numeric_code: "504" },
  { country_code: "MDA", name: "Moldova", numeric_code: "498" },
  { country_code: "MDG", name: "Madagascar", numeric_code: "450" },
  { country_code: "MDV", name: "Maldives", numeric_code: "462" },
  { country_code: "MEX", name: "Mexico", numeric_code: "484" },
  { country_code: "MKD", name: "Macedonia, FYR", numeric_code: "807" },
  { country_code: "MLI", name: "Mali", numeric_code: "466" },
  { country_code: "MLT", name: "Malta", numeric_code: "470" },
  { country_code: "MMR", name: "Myanmar", numeric_code: "104" },
  { country_code: "MNG", name: "Mongolia", numeric_code: "496" },
  { country_code: "MNT", name: "Montenegro", numeric_code: "499" },
  { country_code: "MOZ", name: "Mozambique", numeric_code: "508" },
  { country_code: "MRT", name: "Mauritania", numeric_code: "478" },
  { country_code: "MSR", name: "Montserrat", numeric_code: "500" },
  { country_code: "MUS", name: "Mauritius", numeric_code: "480" },
  { country_code: "MWI", name: "Malawi", numeric_code: "454" },
  { country_code: "MYS", name: "Malaysia", numeric_code: "458" },
  { country_code: "MYT", name: "Mayotte", numeric_code: "175" },
  { country_code: "NAM", name: "Namibia", numeric_code: "516" },
  { country_code: "NER", name: "Niger", numeric_code: "562" },
  { country_code: "NGA", name: "Nigeria", numeric_code: "566" },
  { country_code: "NIC", name: "Nicaragua", numeric_code: "558" },
  { country_code: "NOR", name: "Norway", numeric_code: "578" },
  { country_code: "NPL", name: "Nepal", numeric_code: "524" },
  { country_code: "NRU", name: "Nauru", numeric_code: "520" },
  { country_code: "NZL", name: "New Zealand", numeric_code: "554" },
  { country_code: "OMN", name: "Oman", numeric_code: "512" },
  { country_code: "PAK", name: "Pakistan", numeric_code: "586" },
  { country_code: "PAN", name: "Panama", numeric_code: "591" },
  { country_code: "PER", name: "Peru", numeric_code: "604" },
  { country_code: "PHL", name: "Philippines", numeric_code: "608" },
  { country_code: "PLW", name: "Palau", numeric_code: "585" },
  { country_code: "PNG", name: "Papua New Guinea", numeric_code: "598" },
  { country_code: "POL", name: "Poland", numeric_code: "616" },
  { country_code: "PRK", name: "Korea, Dem. Rep.", numeric_code: "408" },
  { country_code: "PRT", name: "Portugal", numeric_code: "620" },
  { country_code: "PRY", name: "Paraguay", numeric_code: "600" },
  { country_code: "PSE", name: "Occ.Pal.Terr", numeric_code: "275" },
  { country_code: "PYF", name: "French Polynesia", numeric_code: "258" },
  { country_code: "QAT", name: "Qatar", numeric_code: "634" },
  { country_code: "ROM", name: "Romania", numeric_code: "642" },
  { country_code: "RUS", name: "Russian Federation", numeric_code: "643" },
  { country_code: "RWA", name: "Rwanda", numeric_code: "646" },
  { country_code: "SAU", name: "Saudi Arabia", numeric_code: "682" },
  { country_code: "SDN", name: "Fm Sudan", numeric_code: "736" },
  { country_code: "SEN", name: "Senegal", numeric_code: "686" },
  {
    country_code: "SER",
    name: "Serbia, FR(Serbia/Montenegro)",
    numeric_code: "891",
  },
  { country_code: "SGP", name: "Singapore", numeric_code: "702" },
  { country_code: "SLB", name: "Solomon Islands", numeric_code: "090" },
  { country_code: "SLE", name: "Sierra Leone", numeric_code: "694" },
  { country_code: "SLV", name: "El Salvador", numeric_code: "222" },
  { country_code: "SMR", name: "San Marino", numeric_code: "674" },
  { country_code: "STP", name: "Sao Tome and Principe", numeric_code: "678" },
  { country_code: "SUD", name: "Sudan", numeric_code: "729" },
  { country_code: "SUR", name: "Suriname", numeric_code: "740" },
  { country_code: "SVK", name: "Slovak Republic", numeric_code: "703" },
  { country_code: "SVN", name: "Slovenia", numeric_code: "705" },
  { country_code: "SWE", name: "Sweden", numeric_code: "752" },
  { country_code: "SWZ", name: "Swaziland", numeric_code: "748" },
  { country_code: "SYC", name: "Seychelles", numeric_code: "690" },
  { country_code: "SYR", name: "Syrian Arab Republic", numeric_code: "760" },
  { country_code: "TCD", name: "Chad", numeric_code: "148" },
  { country_code: "TGO", name: "Togo", numeric_code: "768" },
  { country_code: "THA", name: "Thailand", numeric_code: "764" },
  { country_code: "TJK", name: "Tajikistan", numeric_code: "762" },
  { country_code: "TKM", name: "Turkmenistan", numeric_code: "795" },
  { country_code: "TMP", name: "East Timor", numeric_code: "626" },
  { country_code: "TON", name: "Tonga", numeric_code: "776" },
  { country_code: "TTO", name: "Trinidad and Tobago", numeric_code: "780" },
  { country_code: "TUN", name: "Tunisia", numeric_code: "788" },
  { country_code: "TUR", name: "Turkey", numeric_code: "792" },
  { country_code: "TUV", name: "Tuvalu", numeric_code: "798" },
  { country_code: "TWN", name: "Taiwan, China", numeric_code: "158" },
  { country_code: "TZA", name: "Tanzania", numeric_code: "834" },
  { country_code: "UGA", name: "Uganda", numeric_code: "800" },
  { country_code: "UKR", name: "Ukraine", numeric_code: "804" },
  { country_code: "UNS", name: "Unspecified", numeric_code: "898" },
  { country_code: "URY", name: "Uruguay", numeric_code: "858" },
  { country_code: "USA", name: "United States", numeric_code: "840" },
  { country_code: "UZB", name: "Uzbekistan", numeric_code: "860" },
  {
    country_code: "VCT",
    name: "St. Vincent and the Grenadines",
    numeric_code: "670",
  },
  { country_code: "VEN", name: "Venezuela", numeric_code: "862" },
  { country_code: "VNM", name: "Vietnam", numeric_code: "704" },
  { country_code: "VUT", name: "Vanuatu", numeric_code: "548" },
  { country_code: "WSM", name: "Samoa", numeric_code: "882" },
  { country_code: "YEM", name: "Yemen", numeric_code: "887" },
  {
    country_code: "YUG",
    name: "Yugoslavia, FR (Serbia/Montenegro)",
    numeric_code: "890",
  },
  { country_code: "ZAF", name: "South Africa", numeric_code: "710" },
  { country_code: "ZAR", name: "Congo, Dem. Rep.", numeric_code: "180" },
  { country_code: "ZMB", name: "Zambia", numeric_code: "894" },
  { country_code: "ZWE", name: "Zimbabwe", numeric_code: "716" },
];

// HS6 product codes and descriptions from WITS data
const products = [
  { hs6code: "290110", description: "Saturated" },
  { hs6code: "290121", description: "Ethylene" },
  { hs6code: "290122", description: "Propene (propylene)" },
  { hs6code: "290123", description: "Butene (butylene) and isomers thereof" },
  { hs6code: "290124", description: "Buta-1,3-diene and isoprene" },
  { hs6code: "290211", description: "Cyclohexane" },
  { hs6code: "290220", description: "Benzene" },
  { hs6code: "290230", description: "Toluene" },
  { hs6code: "290241", description: "o-Xylene" },
  { hs6code: "290242", description: "m-Xylene" },
  { hs6code: "290243", description: "p-Xylene" },
  { hs6code: "290244", description: "Mixed xylene isomers" },
  { hs6code: "290250", description: "Styrene" },
  { hs6code: "290260", description: "Ethylbenzene" },
  { hs6code: "290270", description: "Cumene" },
  {
    hs6code: "290311",
    description:
      "Chloromethane (methyl chloride) and chloroethane (ethyl chloride)",
  },
  { hs6code: "290312", description: "Dichloromethane (methylene chloride)" },
  { hs6code: "290313", description: "Chloroform (trichloromethane)" },
  { hs6code: "290314", description: "Carbon tetrachloride" },
  {
    hs6code: "290315",
    description: "Ethylene dichloride (ISO) (1,2-dichloroethane)",
  },
  {
    hs6code: "290316",
    description:
      "1,2-Dichloropropane (propylene dichloride) and dichlorobutanes",
  },
  { hs6code: "290321", description: "Vinyl chloride (chloroethylene)" },
  { hs6code: "290322", description: "Trichloroethylene" },
  { hs6code: "290323", description: "Tetrachloroethylene (perchloroethylene)" },
  {
    hs6code: "290330",
    description:
      "Fluorinated, brominated or iodinated derivatives of acyclic hydrocarbons",
  },
  {
    hs6code: "290331",
    description: "Ethylene dibromide (ISO) (1,2-dibromoethane)",
  },
  {
    hs6code: "290340",
    description:
      "Halogenated derivatives of acyclic hydrocarbons containing two or more different halogens",
  },
  { hs6code: "290341", description: "Trichlorofluoromethane" },
  { hs6code: "290342", description: "Dichlorodifluoromethane" },
  { hs6code: "290343", description: "Trichlorotrifluoroethanes" },
  {
    hs6code: "290344",
    description: "Dichlorotetrafluoroethanes and chloropentafluoroethane",
  },
  {
    hs6code: "290345",
    description:
      "Other derivatives perhalogenated only with fluorine and chlorine",
  },
  {
    hs6code: "290346",
    description:
      "Bromochlorodifluoromethane, bromotrifluoromethane and dibromotetrafluoroethanes",
  },
  { hs6code: "290347", description: "Other perhalogenated derivatives" },
  {
    hs6code: "290348",
    description:
      "Saturated fluorinated derivatives of acyclic hydrocarbons; 1,1,1,3,3-pentafluorobutane (HFC-365mfc) and 1,1,1,2,2,3,4,5,5,5-decafluoropentane (HFC-43-10mee)",
  },
  {
    hs6code: "290351",
    description:
      "1,2,3,4,5,6-Hexachlorocyclohexane (HCH (ISO)), including lindane (ISO, INN)",
  },
  {
    hs6code: "290352",
    description: "Aldrin (ISO), chlordane (ISO) and heptachlor (ISO)",
  },
  {
    hs6code: "290361",
    description: "Chlorobenzene, o-dichlorobenzene and p-dichlorobenzene",
  },
  {
    hs6code: "290362",
    description:
      "Hexachlorobenzene (ISO) and DDT (ISO) (clofenotane (INN), 1,1,1-trichloro-2,2-bis(p-chlorophenyl)ethane)",
  },
  { hs6code: "290371", description: "Chlorodifluoromethane" },
  { hs6code: "290372", description: "Dichlorotrifluoroethanes" },
  { hs6code: "290373", description: "Dichlorofluoroethanes" },
  { hs6code: "290374", description: "Chlorodifluoroethanes" },
  { hs6code: "290375", description: "Dichloropentafluoropropanes" },
  {
    hs6code: "290376",
    description:
      "Bromochlorodifluoromethane, bromotrifluoromethane and dibromotetrafluoroethanes",
  },
  {
    hs6code: "290377",
    description: "Other, perhalogenated only with fluorine and chlorine",
  },
  { hs6code: "290378", description: "Other perhalogenated derivatives" },
  {
    hs6code: "290381",
    description:
      "1,2,3,4,5,6-Hexachlorocyclohexane (HCH (ISO)), including lindane (ISO, INN)",
  },
  {
    hs6code: "290382",
    description: "Aldrin (ISO), chlordane (ISO) and heptachlor (ISO)",
  },
  { hs6code: "290383", description: "Mirex (ISO)" },
  {
    hs6code: "290391",
    description: "Chlorobenzene, o-dichlorobenzene and p-dichlorobenzene",
  },
  {
    hs6code: "290392",
    description:
      "Hexachlorobenzene (ISO) and DDT (ISO) (clofenotane (INN), 1,1,1-trichloro-2,2-bis(p-chlorophenyl)ethane)",
  },
  { hs6code: "290393", description: "Pentachlorobenzene (ISO)" },
  { hs6code: "290394", description: "Hexabromobiphenyls" },
  {
    hs6code: "290410",
    description:
      "Derivatives containing only sulpho groups, their salts and ethyl esters",
  },
  {
    hs6code: "290420",
    description: "Derivatives containing only nitro or only nitroso groups",
  },
  { hs6code: "290431", description: "Perfluorooctane sulphonic acid" },
  { hs6code: "290432", description: "Ammonium perfluorooctane sulphonate" },
  { hs6code: "290433", description: "Lithium perfluorooctane sulphonate" },
  { hs6code: "290434", description: "Potassium perfluorooctane sulphonate" },
  {
    hs6code: "290435",
    description: "Other salts of perfluorooctane sulphonic acid",
  },
  { hs6code: "290436", description: "Perfluorooctane sulphonyl fluoride" },
  { hs6code: "290491", description: "Trichloronitromethane (chloropicrin)" },
  { hs6code: "290511", description: "Methanol (methyl alcohol)" },
  {
    hs6code: "290512",
    description:
      "Propan-1-ol (propyl alcohol) and propan-2-ol (isopropyl alcohol)",
  },
  { hs6code: "290513", description: "Butan-1-ol (n-butyl alcohol)" },
  { hs6code: "290514", description: "Other butanols" },
  {
    hs6code: "290515",
    description: "Pentanol (amyl alcohol) and isomers thereof",
  },
  {
    hs6code: "290516",
    description: "Octanol (octyl alcohol) and isomers thereof",
  },
  {
    hs6code: "290517",
    description:
      "Dodecan-1-ol (lauryl alcohol), hexadecan-1-ol (cetyl alcohol) and octadecan-1-ol (stearyl alcohol)",
  },
  { hs6code: "290521", description: "Allyl alcohol" },
  { hs6code: "290522", description: "Acyclic terpene alcohols" },
  { hs6code: "290531", description: "Ethylene glycol (ethanediol)" },
  { hs6code: "290532", description: "Propylene glycol (propane-1,2-diol)" },
  {
    hs6code: "290541",
    description:
      "2-Ethyl-2-(hydroxymethyl)propane-1,3-diol (trimethylolpropane)",
  },
  { hs6code: "290542", description: "Pentaerythritol" },
  { hs6code: "290543", description: "Mannitol" },
  { hs6code: "290544", description: "D-glucitol (sorbitol)" },
  { hs6code: "290545", description: "Glycerol" },
  {
    hs6code: "290550",
    description:
      "Halogenated, sulphonated, nitrated or nitrosated derivatives of acyclic alcohols",
  },
  { hs6code: "290551", description: "Ethchlorvynol (INN)" },
  { hs6code: "290611", description: "Menthol" },
  {
    hs6code: "290612",
    description: "Cyclohexanol, methylcyclohexanols and dimethylcyclohexanols",
  },
  { hs6code: "290613", description: "Sterols and inositols" },
  { hs6code: "290614", description: "Terpineols" },
  { hs6code: "290621", description: "Benzyl alcohol" },
  { hs6code: "290711", description: "Phenol (hydroxybenzene) and its salts" },
  { hs6code: "290712", description: "Cresols and their salts" },
  {
    hs6code: "290713",
    description: "Octylphenol, nonylphenol and their isomers; salts thereof",
  },
  { hs6code: "290714", description: "Xylenols and their salts" },
  { hs6code: "290715", description: "Naphthols and their salts" },
  { hs6code: "290721", description: "Resorcinol and its salts" },
  { hs6code: "290722", description: "Hydroquinone (quinol) and its salts" },
  {
    hs6code: "290723",
    description:
      "4,4'-Isopropylidenediphenol (bisphenol A, diphenylolpropane) and its salts",
  },
  { hs6code: "290730", description: "Phenol-alcohols" },
  {
    hs6code: "290810",
    description:
      "Derivatives containing only halogen substituents and their salts",
  },
  { hs6code: "290811", description: "Pentachlorophenol (ISO)" },
  {
    hs6code: "290820",
    description:
      "Derivatives containing only sulpho groups, their salts and esters",
  },
  { hs6code: "290891", description: "Dinoseb (ISO) and its salts" },
  {
    hs6code: "290892",
    description: "4,6-Dinitro-o-cresol (DNOC (ISO)) and its salts",
  },
  { hs6code: "290911", description: "Diethyl ether" },
  {
    hs6code: "290920",
    description:
      "Cyclanic, cyclenic or cycloterpenic ethers and their halogenated, sulphonated, nitrated or nitrosated derivatives",
  },
  {
    hs6code: "290930",
    description:
      "Aromatic ethers and their halogenated, sulphonated, nitrated or nitrosated derivatives",
  },
  {
    hs6code: "290941",
    description: "2,2'-Oxydiethanol (diethylene glycol, digol)",
  },
  {
    hs6code: "290942",
    description: "Monomethyl ethers of ethylene glycol or of diethylene glycol",
  },
  {
    hs6code: "290943",
    description: "Monobutyl ethers of ethylene glycol or of diethylene glycol",
  },
  {
    hs6code: "290944",
    description:
      "Other monoalkylethers of ethylene glycol or of diethylene glycol",
  },
  {
    hs6code: "290950",
    description:
      "Ether-phenols, ether-alcohol-phenols and their halogenated, sulphonated, nitrated or nitrosated derivatives",
  },
  {
    hs6code: "290960",
    description:
      "Alcohol peroxides, ether peroxides, ketone peroxides and their halogenated, sulphonated, nitrated or nitrosated derivatives",
  },
  { hs6code: "291010", description: "Oxirane (ethylene oxide)" },
  { hs6code: "291020", description: "Methyloxirane (propylene oxide)" },
  {
    hs6code: "291030",
    description: "1-Chloro-2,3-epoxypropane (epichlorohydrin)",
  },
  { hs6code: "291040", description: "Dieldrin (ISO, INN)" },
  { hs6code: "291050", description: "Endrin (ISO)" },
  {
    hs6code: "291100",
    description:
      "Acetals and hemiacetals, whether or not with other oxygen function, and their halogenated, sulphonated, nitrated or nitrosated derivatives",
  },
  { hs6code: "291211", description: "Methanal (formaldehyde)" },
  { hs6code: "291212", description: "Ethanal (acetaldehyde)" },
  { hs6code: "291213", description: "Butanal (butyraldehyde, normal isomer)" },
  { hs6code: "291221", description: "Benzaldehyde" },
  { hs6code: "291230", description: "Aldehyde-alcohols" },
  {
    hs6code: "291241",
    description: "Vanillin (4-hydroxy-3-methoxybenzaldehyde)",
  },
  {
    hs6code: "291242",
    description: "Ethylvanillin (3-ethoxy-4-hydroxybenzaldehyde)",
  },
  { hs6code: "291250", description: "Cyclic polymers of aldehydes" },
  { hs6code: "291260", description: "Paraformaldehyde" },
  {
    hs6code: "291300",
    description:
      "Halogenated, sulphonated, nitrated or nitrosated derivatives of products of heading 2912",
  },
  { hs6code: "291411", description: "Acetone" },
  { hs6code: "291412", description: "Butanone (methyl ethyl ketone)" },
  {
    hs6code: "291413",
    description: "4-Methylpentan-2-one (methyl isobutyl ketone)",
  },
  { hs6code: "291421", description: "Camphor" },
  { hs6code: "291422", description: "Cyclohexanone and methylcyclohexanones" },
  { hs6code: "291423", description: "Ionones and methylionones" },
  {
    hs6code: "291430",
    description: "Aromatic ketones without other oxygen function",
  },
  { hs6code: "291431", description: "Phenylacetone (phenylpropan-2-one)" },
  { hs6code: "291440", description: "Ketone-alcohols and ketone-aldehydes" },
  {
    hs6code: "291441",
    description: "4-Hydroxy-4-methylpentan-2-one (diacetone alcohol)",
  },
  {
    hs6code: "291450",
    description: "Ketone-phenols and ketones with other oxygen function",
  },
  { hs6code: "291461", description: "Anthraquinone" },
  { hs6code: "291462", description: "Coenzyme Q10 (ubidecarenone (INN))" },
  {
    hs6code: "291470",
    description: "Halogenated, sulphonated, nitrated or nitrosated derivatives",
  },
  { hs6code: "291471", description: "Chlordecone (ISO)" },
  { hs6code: "291511", description: "Formic acid" },
  { hs6code: "291512", description: "Salts of formic acid" },
  { hs6code: "291513", description: "Esters of formic acid" },
  { hs6code: "291521", description: "Acetic acid" },
  { hs6code: "291522", description: "Sodium acetate" },
  { hs6code: "291523", description: "Cobalt acetates" },
  { hs6code: "291524", description: "Acetic anhydride" },
  { hs6code: "291531", description: "Ethyl acetate" },
  { hs6code: "291532", description: "Vinyl acetate" },
  { hs6code: "291533", description: "n-Butyl acetate" },
  { hs6code: "291534", description: "Isobutyl acetate" },
  { hs6code: "291535", description: "2- Ethoxyethyl acetate" },
  { hs6code: "291536", description: "Dinoseb (ISO) acetate" },
  {
    hs6code: "291540",
    description: "Mono-, di- or trichloroacetic acids, their salts and esters",
  },
  { hs6code: "291550", description: "Propionic acid, its salts and esters" },
  {
    hs6code: "291560",
    description: "Butanoic acids, pentanoic acids, their salts and esters",
  },
  {
    hs6code: "291570",
    description: "Palmitic acid, stearic acid, their salts and esters",
  },
  { hs6code: "291611", description: "Acrylic acid and its salts" },
  { hs6code: "291612", description: "Esters of acrylic acid" },
  { hs6code: "291613", description: "Methacrylic acid and its salts" },
  { hs6code: "291614", description: "Esters of methacrylic acid" },
  {
    hs6code: "291615",
    description: "Oleic, linoleic or linolenic acids, their salts and esters",
  },
  { hs6code: "291616", description: "Binapacryl (ISO)" },
  {
    hs6code: "291620",
    description:
      "Cyclanic, cyclenic or cycloterpenic monocarboxylic acids, their anhydrides, halides, peroxides, peroxyacids and their derivatives",
  },
  { hs6code: "291631", description: "Benzoic acid, its salts and esters" },
  { hs6code: "291632", description: "Benzoyl peroxide and benzoyl chloride" },
  { hs6code: "291633", description: "Phenylacetic acid, its salts and esters" },
  { hs6code: "291634", description: "Phenylacetic acid and its salts" },
  { hs6code: "291635", description: "Esters of phenylacetic acid" },
  { hs6code: "291636", description: "Binapacryl (ISO)" },
  { hs6code: "291711", description: "Oxalic acid, its salts and esters" },
  { hs6code: "291712", description: "Adipic acid, its salts and esters" },
  {
    hs6code: "291713",
    description: "Azelaic acid, sebacic acid, their salts and esters",
  },
  { hs6code: "291714", description: "Maleic anhydride" },
  {
    hs6code: "291720",
    description:
      "Cyclanic, cyclenic or cycloterpenic polycarboxylic acids, their anhydrides, halides, peroxides, peroxyacids and their derivatives",
  },
  { hs6code: "291731", description: "Dibutyl orthophthalates" },
  { hs6code: "291732", description: "Dioctyl orthophthalates" },
  { hs6code: "291733", description: "Dinonyl or didecyl orthophthalates" },
  { hs6code: "291734", description: "Other esters of orthophthalic acid" },
  { hs6code: "291735", description: "Phthalic anhydride" },
  { hs6code: "291736", description: "Terephthalic acid and its salts" },
  { hs6code: "291737", description: "Dimethyl terephthalate" },
  { hs6code: "291811", description: "Lactic acid, its salts and esters" },
  { hs6code: "291812", description: "Tartaric acid" },
  { hs6code: "291813", description: "Salts and esters of tartaric acid" },
  { hs6code: "291814", description: "Citric acid" },
  { hs6code: "291815", description: "Salts and esters of citric acid" },
  { hs6code: "291816", description: "Gluconic acid, its salts and esters" },
  {
    hs6code: "291817",
    description: "2,2-Diphenyl-2-hydroxyacetic acid (benzilic acid)",
  },
  { hs6code: "291818", description: "Chlorobenzilate (ISO)" },
  { hs6code: "291821", description: "Salicylic acid and its salts" },
  {
    hs6code: "291822",
    description: "o-Acetylsalicylic acid, its salts and esters",
  },
  {
    hs6code: "291823",
    description: "Other esters of salicylic acid and their salts",
  },
  {
    hs6code: "291830",
    description:
      "Carboxylic acids with aldehyde or ketone function but without other oxygen function, their anhydrides, halides, peroxides, peroxyacids and their derivatives",
  },
  {
    hs6code: "291891",
    description:
      "2,4,5-T (ISO) (2,4,5-trichlorophenoxyacetic acid), its salts and esters",
  },
  {
    hs6code: "291900",
    description:
      "Phosphoric esters and their salts, including lactophosphates; their halogenated, sulphonated, nitrated or nitrosated derivatives.",
  },
  { hs6code: "291910", description: "Tris(2,3-dibromopropyl) phosphate" },
  {
    hs6code: "292010",
    description:
      "Thiophosphoric esters (phosphorothioates) and their salts; their halogenated, sulphonated, nitrated or nitrosated derivatives",
  },
  {
    hs6code: "292011",
    description:
      "Parathion (ISO) and parathion-methyl (ISO) (methyl-parathion)",
  },
  { hs6code: "292021", description: "Dimethyl phosphite" },
  { hs6code: "292022", description: "Diethyl phosphite" },
  { hs6code: "292023", description: "Trimethyl phosphite" },
  { hs6code: "292024", description: "Triethyl phosphite" },
  { hs6code: "292030", description: "Endosulfan (ISO)" },
  {
    hs6code: "292111",
    description: "Methylamine, di- or trimethylamine and their salts",
  },
  {
    hs6code: "292112",
    description: "2-(N,N-Dimethylamino)ethylchloride hydrochloride",
  },
  {
    hs6code: "292113",
    description: "2-(N,N-Diethylamino)ethylchloride hydrochloride",
  },
  {
    hs6code: "292114",
    description: "2-(N,N-Diisopropylamino)ethylchloride hydrochloride",
  },
  { hs6code: "292121", description: "Ethylenediamine and its salts" },
  { hs6code: "292122", description: "Hexamethylenediamine and its salts" },
  {
    hs6code: "292130",
    description:
      "Cyclanic, cyclenic or cycloterpenic mono- or polyamines, and their derivatives; salts thereof",
  },
  { hs6code: "292141", description: "Aniline and its salts" },
  { hs6code: "292142", description: "Aniline derivatives and their salts" },
  {
    hs6code: "292143",
    description: "Toluidines and their derivatives; salts thereof",
  },
  {
    hs6code: "292144",
    description: "Diphenylamine and its derivatives; salts thereof",
  },
  {
    hs6code: "292145",
    description:
      "1-Naphthylamine (a-naphthylamine), 2-naphthylamine (ß-naphthylamine) and their derivatives; salts thereof",
  },
  {
    hs6code: "292146",
    description:
      "Amfetamine (INN), benzfetamine (INN), dexamfetamine (INN), etilamfetamine (INN), fencamfamin (INN), lefetamine (INN), levamfetamine (INN), mefenorex (INN) and phentermine (INN); salts thereof",
  },
  {
    hs6code: "292151",
    description:
      "o-, m-, p-Phenylenediamine, diaminotoluenes, and their derivatives; salts thereof",
  },
  { hs6code: "292211", description: "Monoethanolamine and its salts" },
  { hs6code: "292212", description: "Diethanolamine and its salts" },
  { hs6code: "292213", description: "Triethanolamine and its salts" },
  { hs6code: "292214", description: "Dextropropoxyphene (INN) and its salts" },
  { hs6code: "292215", description: "Triethanolamine" },
  {
    hs6code: "292216",
    description: "Diethanolammonium perfluorooctane sulphonate",
  },
  {
    hs6code: "292217",
    description: "Methyldiethanolamine and ethyldiethanolamine",
  },
  { hs6code: "292218", description: "2-(N,N-Diisopropylamino)ethanol" },
  {
    hs6code: "292221",
    description: "Aminohydroxynaphthalenesulphonic acids and their salts",
  },
  {
    hs6code: "292222",
    description: "Anisidines, dianisidines, phenetidines, and their salts",
  },
  {
    hs6code: "292230",
    description:
      "Amino-aldehydes, amino-ketones and amino-quinones, other than those containing more than one kind of oxygen function; salts thereof",
  },
  {
    hs6code: "292231",
    description:
      "Amfepramone (INN), methadone (INN) and normethadone (INN); salts thereof",
  },
  { hs6code: "292241", description: "Lysine and its esters; salts thereof" },
  { hs6code: "292242", description: "Glutamic acid and its salts" },
  { hs6code: "292243", description: "Anthranilic acid and its salts" },
  { hs6code: "292244", description: "Tilidine (INN) and its salts" },
  {
    hs6code: "292250",
    description:
      "Amino-alcohol-phenols, amino-acid-phenols and other amino-compounds with oxygen function",
  },
  { hs6code: "292310", description: "Choline and its salts" },
  { hs6code: "292320", description: "Lecithins and other phosphoaminolipids" },
  {
    hs6code: "292330",
    description: "Tetraethylammonium perfluorooctane sulphonate",
  },
  {
    hs6code: "292340",
    description: "Didecyldimethylammonium perfluorooctane sulphonate",
  },
  {
    hs6code: "292410",
    description:
      "Acyclic amides (including acyclic carbamates) and their derivatives; salts thereof",
  },
  { hs6code: "292411", description: "Meprobamate (INN)" },
  {
    hs6code: "292412",
    description:
      "Fluoroacetamide (ISO), monocrotophos (ISO) and phosphamidon (ISO)",
  },
  {
    hs6code: "292421",
    description: "Ureines and their derivatives; salts thereof",
  },
  { hs6code: "292422", description: "2-Acetamidobenzoic acid" },
  {
    hs6code: "292423",
    description:
      "2-Acetamidobenzoic acid (N-acetylanthranilic acid) and its salts",
  },
  { hs6code: "292424", description: "Ethinamate (INN)" },
  { hs6code: "292425", description: "Alachlor (ISO)" },
  { hs6code: "292511", description: "Saccharin and its salts" },
  { hs6code: "292512", description: "Glutethimide (INN)" },
  {
    hs6code: "292520",
    description: "Imines and their derivatives; salts thereof",
  },
  { hs6code: "292521", description: "Chlordimeform (ISO)" },
  { hs6code: "292610", description: "Acrylonitrile" },
  { hs6code: "292620", description: "1-Cyanoguanidine (dicyandiamide)" },
  {
    hs6code: "292630",
    description:
      "Fenproporex (INN) and its salts; methadone (INN) intermediate (4-cyano-2-dimethylamino-4,4-diphenylbutane)",
  },
  { hs6code: "292640", description: "alpha-Phenylacetoacetonitrile" },
  { hs6code: "292700", description: "Diazo-, azo- or azoxy-compounds" },
  {
    hs6code: "292800",
    description: "Organic derivatives of hydrazine or of hydroxylamine",
  },
  { hs6code: "292910", description: "Isocyanates" },
  { hs6code: "293010", description: "Dithiocarbonates (xanthates)" },
  { hs6code: "293020", description: "Thiocarbamates and dithiocarbamates" },
  { hs6code: "293030", description: "Thiuram mono-, di- or tetrasulphides" },
  { hs6code: "293040", description: "Methionine" },
  { hs6code: "293050", description: "Captafol (ISO) and methamidophos (ISO)" },
  { hs6code: "293060", description: "2-(N,N-Diethylamino)ethanethiol" },
  {
    hs6code: "293070",
    description: "Bis(2-hydroxyethyl)sulfide (thiodiglycol (INN))",
  },
  {
    hs6code: "293080",
    description: "Aldicarb (ISO), Captafol (ISO) and methamidophos (ISO)",
  },
  { hs6code: "293100", description: "Other organo-inorganic compounds." },
  { hs6code: "293110", description: "Tetramethyl lead and tetraethyl lead" },
  { hs6code: "293120", description: "Tributyltin compounds" },
  { hs6code: "293131", description: "Dimethyl methylphosphonate" },
  { hs6code: "293132", description: "Dimethyl propylphosphonate" },
  { hs6code: "293133", description: "Diethyl ethylphosphonate" },
  {
    hs6code: "293134",
    description: "Sodium 3-(trihydroxysilyl)propyl methylphosphonate",
  },
  {
    hs6code: "293135",
    description:
      "2,4,6-Tripropyl-1,3,5,2,4,6-trioxatriphosphinane 2,4,6-trioxide",
  },
  {
    hs6code: "293136",
    description:
      "(5-Ethyl-2-methyl-2-oxido-1,3,2-dioxaphosphinan-5-yl)methyl methyl methylphosphonate",
  },
  {
    hs6code: "293137",
    description:
      "Bis[(5-ethyl-2-methyl-2-oxido-1,3,2-dioxaphosphinan-5-yl)methyl] methylphosphonate",
  },
  {
    hs6code: "293138",
    description:
      "Salt of methylphosphonic acid and (aminoiminomethyl)urea (1 : 1)",
  },
  {
    hs6code: "293141",
    description:
      "Non-halogenated organo-phosphorous derivatives; dimethyl methylphosphonate",
  },
  {
    hs6code: "293142",
    description:
      "Non-halogenated organo-phosphorous derivatives; dimethyl propylphosphonate",
  },
  {
    hs6code: "293143",
    description:
      "Non-halogenated organo-phosphorous derivatives; diethyl ethylphosphonate",
  },
  {
    hs6code: "293144",
    description:
      "Non-halogenated organo-phosphorous derivatives; methylphosphonic acid",
  },
  {
    hs6code: "293145",
    description:
      "Non-halogenated organo-phosphorous derivatives; salt of methylphosphonic acid and (aminominomethyl) urea (1:1)",
  },
  {
    hs6code: "293146",
    description:
      "Non-halogenated organo-phosphorous derivatives; 2,4,6-tripropyl-1,3,5,2,4,6-trioxatriphosphinane 2,4,6-trioxide",
  },
  {
    hs6code: "293147",
    description:
      "Non-halogenated organo-phosphorous derivatives; (5-ethyl-2-methyl-2-oxido-1,3,2-dioxaphosphinan-5-yl) methyl methyl methylphosphonate",
  },
  {
    hs6code: "293148",
    description:
      "Non-halogenated organo-phosphorous derivatives; 3,9-dimethyl-2,4,8,10-tetraoxa-3,9-diphosphaspiro[5.5] undecane 3,9-dioxide",
  },
  {
    hs6code: "293149",
    description:
      "Non-halogenated organo-phosphorous derivatives; other non-halogenated organo-phosphorous derivatives, n.e.c. in item no. 2931.4",
  },
  {
    hs6code: "293151",
    description:
      "Halogenated organo-phosphorous derivatives; methylphosphonic dichloride",
  },
  {
    hs6code: "293152",
    description:
      "Halogenated organo-phosphorous derivatives; propylphosphonic dichloride",
  },
  {
    hs6code: "293153",
    description:
      "Halogenated organo-phosphorous derivatives; O-(3-chloropropyl) O-[4-nitro-3-(trifluoromethyl)phenyl] methylphosphonothionate",
  },
  {
    hs6code: "293154",
    description:
      "Halogenated organo-phosphorous derivatives; trichlorfon (ISO)",
  },
  {
    hs6code: "293159",
    description:
      "Halogenated organo-phosphorous derivatives; other halogenated organo-phosphorous derivatives, n.e.c. in item no. 2931.5",
  },
  { hs6code: "293211", description: "Tetrahydrofuran" },
  { hs6code: "293212", description: "2-Furaldehyde (furfuraldehyde)" },
  {
    hs6code: "293213",
    description: "Furfuryl alcohol and tetrahydrofurfuryl alcohol",
  },
  { hs6code: "293214", description: "Sucralose" },
  { hs6code: "293220", description: "Lactones" },
  {
    hs6code: "293221",
    description: "Coumarin, methylcoumarins and ethylcoumarins",
  },
  { hs6code: "293229", description: "Other lactones" },
  { hs6code: "293291", description: "Isosafrole" },
  { hs6code: "293292", description: "1-(1,3-Benzodioxol-5-yl)propan-2-one" },
  { hs6code: "293293", description: "Piperonal" },
  { hs6code: "293294", description: "Safrole" },
  { hs6code: "293295", description: "Tetrahydrocannabinols (all isomers)" },
  {
    hs6code: "293296",
    description:
      "Heterocyclic compounds; with oxygen hetero-atom(s) only, (other than lactones or compounds containing an unfused furan ring (whether or not hydrogenated) in the structure), carbofuran (ISO)",
  },
  {
    hs6code: "293311",
    description: "Phenazone (antipyrin) and its derivatives",
  },
  { hs6code: "293321", description: "Hydantoin and its derivatives" },
  { hs6code: "293331", description: "Pyridine and its salts" },
  { hs6code: "293332", description: "Piperidine and its salts" },
  {
    hs6code: "293333",
    description:
      "Alfentanil (INN), anileridine (INN), bezitramide (INN), bromazepam (INN), difenoxin (INN), diphenoxylate (INN), dipipanone (INN), fentanyl (INN), ketobemidone (INN), methylphenidate (INN), pentazocine (INN), pethidine (INN), pethidine (INN) intermediat",
  },
  {
    hs6code: "293334",
    description:
      "Heterocyclic compounds; containing an unfused pyridine ring (whether or not hydrogenated) in the structure, other fentanyls and their derivatives",
  },
  {
    hs6code: "293335",
    description:
      "Heterocyclic compounds; containing an unfused pyridine ring (whether or not hydrogenated) in the structure, 3-quinuclidinol",
  },
  {
    hs6code: "293336",
    description:
      "Heterocyclic compounds; containing an unfused pyridine ring (whether or not hydrogenated) in the structure, 4-anilino-N-phenethylpiperidine (ANPP)",
  },
  {
    hs6code: "293337",
    description:
      "Heterocyclic compounds; containing an unfused pyridine ring (whether or not hydrogenated) in the structure, N-phenethyl-4-piperdone (NPP)",
  },
  {
    hs6code: "293340",
    description:
      "Compounds containing a quinoline or isoquinoline ring-system (whether or not hydrogenated), not further fused",
  },
  { hs6code: "293341", description: "Levorphanol (INN) and its salts" },
  {
    hs6code: "293351",
    description:
      "Malonylurea (barbituric acid) and its derivatives; salts thereof",
  },
  {
    hs6code: "293352",
    description: "Malonylurea (barbituric acid) and its salts",
  },
  {
    hs6code: "293353",
    description:
      "Allobarbital (INN), amobarbital (INN), barbital (INN), butalbital (INN), butobarbital, cyclobarbital (INN), methylphenobarbital (INN), pentobarbital (INN), phenobarbital (INN), secbutabarbital (INN), secobarbital (INN) and vinylbital (INN); salts there",
  },
  {
    hs6code: "293354",
    description:
      "Other derivatives of malonylurea (barbituric acid); salts thereof",
  },
  {
    hs6code: "293355",
    description:
      "Loprazolam (INN), mecloqualone (INN), methaqualone (INN) and zipeprol (INN); salts thereof",
  },
  { hs6code: "293361", description: "Melamine" },
  { hs6code: "293371", description: "6-Hexanelactam (epsilon-caprolactam)" },
  { hs6code: "293372", description: "Clobazam (INN) and methyprylon (INN)" },
  { hs6code: "293379", description: "Other lactams" },
  {
    hs6code: "293391",
    description:
      "Alprazolam (INN), camazepam (INN), chlordiazepoxide (INN), clonazepam (INN), clorazepate, delorazepam (INN), diazepam (INN), estazolam (INN), ethyl loflazepate (INN), fludiazepam (INN), flunitrazepam (INN), flurazepam (INN), halazepam (INN), lorazepam",
  },
  { hs6code: "293392", description: "Azinphos-methyl (ISO)" },
  {
    hs6code: "293410",
    description:
      "Compounds containing an unfused thiazole ring (whether or not hydrogenated) in the structure",
  },
  {
    hs6code: "293420",
    description:
      "Compounds containing in the structure a benzothiazole ring-system (whether or not hydrogenated), not further fused",
  },
  {
    hs6code: "293430",
    description:
      "Compounds containing in the structure a phenothiazine ring-system (whether or not hydrogenated), not further fused",
  },
  {
    hs6code: "293491",
    description:
      "Aminorex (INN), brotizolam (INN), clotiazepam (INN), cloxazolam (INN), dextromoramide (INN), haloxazolam (INN), ketazolam (INN), mesocarb (INN), oxazolam (INN), pemoline (INN), phendimetrazine (INN), phenmetrazine (INN) and sufentanil (INN); salts ther",
  },
  {
    hs6code: "293492",
    description:
      "Heterocyclic compounds; other fentanyls n.e.c. in 2934, and their derivatives",
  },
  { hs6code: "293500", description: "Sulphonamides." },
  { hs6code: "293510", description: "N-Methylperfluorooctane sulphonamide" },
  { hs6code: "293520", description: "N-Ethylperfluorooctane sulphonamide" },
  {
    hs6code: "293530",
    description: "N-Ethyl-N-(2-hydroxyethyl) perfluorooctane sulphonamide",
  },
  {
    hs6code: "293540",
    description: "N-(2-Hydroxyethyl)-N-methylperfluorooctane sulphonamide",
  },
  { hs6code: "293550", description: "Other perfluorooctane sulphonamides" },
  { hs6code: "293610", description: "Provitamins, unmixed" },
  { hs6code: "293621", description: "Vitamins A and their derivatives" },
  { hs6code: "293622", description: "Vitamin B1 and its derivatives" },
  { hs6code: "293623", description: "Vitamin B2 and its derivatives" },
  {
    hs6code: "293624",
    description:
      "D- or DL-Pantothenic acid (vitamin B3 or vitamin B5) and its derivatives",
  },
  { hs6code: "293625", description: "Vitamin B6 and its derivatives" },
  { hs6code: "293626", description: "Vitamin B12 and its derivatives" },
  { hs6code: "293627", description: "Vitamin C and its derivatives" },
  { hs6code: "293628", description: "Vitamin E and its derivatives" },
  { hs6code: "293629", description: "Other vitamins and their derivatives" },
  { hs6code: "293690", description: "Other, including natural concentrates" },
  {
    hs6code: "293710",
    description:
      "Pituitary (anterior) or similar hormones, and their derivatives",
  },
  {
    hs6code: "293711",
    description: "Somatotropin, its derivatives and structural analogues",
  },
  { hs6code: "293712", description: "Insulin and its salts" },
  {
    hs6code: "293721",
    description:
      "Cortisone, hydrocortisone, prednisone (dehydrocortisone) and prednisolone (dehydrohydrocortisone)",
  },
  {
    hs6code: "293722",
    description: "Halogenated derivatives of corticosteroidal hormones",
  },
  { hs6code: "293723", description: "Oestrogens and progestogens" },
  { hs6code: "293731", description: "Epinephrine" },
  { hs6code: "293740", description: "Amino-acid derivatives" },
  {
    hs6code: "293750",
    description:
      "Prostaglandins, thromboxanes and leukotrienes, their derivatives and structural analogues",
  },
  { hs6code: "293791", description: "Insulin and its salts" },
  { hs6code: "293792", description: "Oestrogens and progestogens" },
  { hs6code: "293810", description: "Rutoside (rutin) and its derivatives" },
  {
    hs6code: "293910",
    description: "Alkaloids of opium and their derivatives; salts thereof",
  },
  {
    hs6code: "293911",
    description:
      "Concentrates of poppy straw; buprenorphine (INN), codeine, dihydrocodeine (INN), ethylmorphine, etorphine (INN), heroin, hydrocodone (INN), hydromorphone (INN), morphine, nicomorphine (INN), oxycodone (INN), oxymorphone (INN), pholcodine (INN), thebaco",
  },
  {
    hs6code: "293920",
    description: "Alkaloids of cinchona and their derivatives; salts thereof",
  },
  { hs6code: "293921", description: "Quinine and its salts" },
  { hs6code: "293930", description: "Caffeine and its salts" },
  { hs6code: "293940", description: "Ephedrines and their salts" },
  { hs6code: "293941", description: "Ephedrine and its salts" },
  { hs6code: "293942", description: "Pseudoephedrine (INN) and its salts" },
  { hs6code: "293943", description: "Cathine (INN) and its salts" },
  { hs6code: "293944", description: "Norephedrine and its salts" },
  {
    hs6code: "293945",
    description:
      "Alkaloids; of ephedrine and their derivatives; levometamfetamine, metamfetamine (INN), metamefetamine racemate and their salts",
  },
  {
    hs6code: "293950",
    description:
      "Theophylline and aminophylline (theophylline- ethylenediamine) and their derivatives; salts thereof",
  },
  { hs6code: "293951", description: "Fenetylline (INN) and its salts" },
  {
    hs6code: "293960",
    description: "Alkaloids of rye ergot and their derivatives; salts thereof",
  },
  { hs6code: "293961", description: "Ergometrine (INN) and its salts" },
  { hs6code: "293962", description: "Ergotamine (INN) and its salts" },
  { hs6code: "293963", description: "Lysergic acid and its salts" },
  { hs6code: "293970", description: "Nicotine and its salts" },
  {
    hs6code: "293971",
    description:
      "Cocaine, ecgonine, levometamfetamine, metamfetamine (INN), metamfetamine racemate; salts, esters and other derivatives thereof",
  },
  {
    hs6code: "293972",
    description:
      "Alkaloids; of vegetal origin, cocaine, ecgonine; salts, esters and other derivatives thereof",
  },
  {
    hs6code: "293991",
    description:
      "Cocaine, ecgonine, levometamfetamine, metamfetamine (INN), metamfetamine racemate; salts, esters and other derivatives thereof",
  },
  {
    hs6code: "294000",
    description:
      "Sugars, chemically pure, other than sucrose, lactose, maltose, glucose and fructose; sugar ethers, sugar acetals and sugar esters, and their salts, other than products of heading 2937, 2938 or 2939",
  },
  {
    hs6code: "294110",
    description:
      "Penicillins and their derivatives with a penicillanic acid structure; salts thereof",
  },
  {
    hs6code: "294120",
    description: "Streptomycins and their derivatives; salts thereof",
  },
  {
    hs6code: "294130",
    description: "Tetracyclines and their derivatives; salts thereof",
  },
  {
    hs6code: "294140",
    description: "Chloramphenicol and its derivatives; salts thereof",
  },
  {
    hs6code: "294150",
    description: "Erythromycin and its derivatives; salts thereof",
  },
  { hs6code: "294200", description: "Other organic compounds" },
];

async function main() {
  // Seed countries
  console.log("Seeding countries...");
  for (const country of countries) {
    await prisma.country.upsert({
      where: { country_code: country.country_code },
      update: { name: country.name, numeric_code: country.numeric_code },
      create: {
        country_code: country.country_code,
        name: country.name,
        numeric_code: country.numeric_code,
      },
    });
  }
  console.log(`Seeded ${countries.length} countries.`);

  // Seed products
  console.log("Seeding products...");
  for (const product of products) {
    await prisma.product.upsert({
      where: { hs6code: product.hs6code },
      update: { description: product.description },
      create: {
        hs6code: product.hs6code,
        description: product.description,
      },
    });
  }
  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
