import { useState } from 'react';

// Simple localStorage-backed key-value hook
export function useKV<T>(key: string, initialValue: T): [T, (val: T | ((curr: T) => T)) => void, () => void] {
	const getStored = () => {
		try {
			const item = localStorage.getItem(key);
			return item ? (JSON.parse(item) as T) : initialValue;
		} catch {
			return initialValue;
		}
	};
	const [value, setValue] = useState<T>(getStored());
	const setKV = (val: T | ((curr: T) => T)) => {
		const newValue = typeof val === 'function' ? (val as (curr: T) => T)(value) : val;
		setValue(newValue);
		localStorage.setItem(key, JSON.stringify(newValue));
	};
	const deleteKV = () => {
		setValue(initialValue);
		localStorage.removeItem(key);
	};
	return [value, setKV, deleteKV];
}