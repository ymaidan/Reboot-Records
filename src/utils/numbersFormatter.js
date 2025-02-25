export function numberWithOrdinal(n) {
	if (n % 100 >= 11 && n % 100 <= 13) {
		return n + "th";
	}
	const suffixes = ["th", "st", "nd", "rd"];
	const lastDigit = n % 10;
	if (n == undefined) {
		return "Invalid Number";
	}
	return n + (suffixes[lastDigit] || "th");
}