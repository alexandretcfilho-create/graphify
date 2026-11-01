import { STORES, type StoreName, type Tabelas } from './types';

/** IndexedDB: os dados ficam só no aparelho. */
const NOME = 'treino';
const VERSAO = 1;
const META = 'meta';

let conexao: Promise<IDBDatabase> | null = null;

function abrir(): Promise<IDBDatabase> {
  if (conexao) return conexao;
  conexao = new Promise((resolve, reject) => {
    const req = indexedDB.open(NOME, VERSAO);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return conexao;
}

function pedido<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function fim(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function listar<K extends StoreName>(store: K): Promise<Tabelas[K][]> {
  const db = await abrir();
  return pedido(db.transaction(store).objectStore(store).getAll()) as Promise<Tabelas[K][]>;
}

export async function salvar<K extends StoreName>(store: K, item: Tabelas[K]): Promise<void> {
  const db = await abrir();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).put(item);
  await fim(tx);
}

export async function remover(store: StoreName, id: string): Promise<void> {
  const db = await abrir();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).delete(id);
  await fim(tx);
}

export async function lerMeta<T>(chave: string): Promise<T | undefined> {
  const db = await abrir();
  return pedido(db.transaction(META).objectStore(META).get(chave)) as Promise<T | undefined>;
}

export async function gravarMeta(chave: string, valor: unknown): Promise<void> {
  const db = await abrir();
  const tx = db.transaction(META, 'readwrite');
  tx.objectStore(META).put(valor, chave);
  await fim(tx);
}

/** Substitui tudo (restauração de backup) numa única transação. */
export async function substituirTudo(
  dados: { [K in StoreName]: Tabelas[K][] },
  meta: Record<string, unknown>,
): Promise<void> {
  const db = await abrir();
  const tx = db.transaction([...STORES, META], 'readwrite');
  for (const s of STORES) {
    const os = tx.objectStore(s);
    os.clear();
    for (const item of dados[s] ?? []) os.put(item);
  }
  const m = tx.objectStore(META);
  for (const [k, v] of Object.entries(meta)) m.put(v, k);
  await fim(tx);
}
