import type PocketBase from 'pocketbase';

type RecordWithCreated = {
	created?: string;
};

export function addCreatedYearFilter(filters: string[], year: string) {
	if (!/^\d{4}$/.test(year)) return;

	const start = `${year}-01-01 00:00:00`;
	const end = `${Number(year) + 1}-01-01 00:00:00`;

	filters.push(`created >= "${start}" && created < "${end}"`);
}

export async function getCollectionYears(pb: PocketBase, collection: string) {
	const records = await pb.collection(collection).getFullList<RecordWithCreated>({
		sort: '-created',
		fields: 'created'
	});

	return Array.from(
		new Set(
			records
				.map((record) => record.created?.slice(0, 4))
				.filter((value): value is string => !!value && /^\d{4}$/.test(value))
		)
	).sort((a, b) => Number(b) - Number(a));
}
