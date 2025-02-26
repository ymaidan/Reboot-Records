export function formatBytes(bytes, useDecimal = false) {
	const base = useDecimal ? 1000 : 1024; // Choose 1000 (decimal) or 1024 (binary)
	const units = ["Bytes", "KB", "MB", "GB", "TB"];
	let index = 0;
	while (bytes >= base && index < units.length - 1) {
		bytes /= base;
		index++;
	}
	if (bytes == undefined) {
		return "Unknown";
	}
	return Math.ceil(bytes) + " " + units[index]; // Round up for consistency
}