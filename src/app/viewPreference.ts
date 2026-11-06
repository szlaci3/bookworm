import db from '../features/collections/persistence/collectionsDb';
export type CatalogView = '2d' | '3d';
export async function readCatalogView(): Promise<CatalogView> {
  try { return (await db.preferences.get('catalogView'))?.value === '2d' ? '2d' : '3d'; }
  catch { return '3d'; }
}
export async function saveCatalogView(view: CatalogView) {
  try { await db.preferences.put({ key: 'catalogView', value: view }); }
  catch { /* Browsing remains available when storage is unavailable. */ }
}
