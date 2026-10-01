import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  Coffee,
  GraduationCap,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Trash2,
  Utensils,
  X
} from 'lucide-react';
import '../style.css';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateLabel = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
const today = () => new Date().toISOString().slice(0, 10);
const API_BASE = import.meta.env.VITE_API_URL || '';
const LOCAL_DATA_KEY = 'cafeteria-escolar-data-v1';
const initialData = {
  estudiantes: [
    { id: 1, nombre: 'Ana López', grupo: '1A' },
    { id: 2, nombre: 'Carlos Ruiz', grupo: '1B' },
    { id: 3, nombre: 'María Torres', grupo: '2A' },
    { id: 4, nombre: 'Luis Pérez', grupo: '2B' },
    { id: 5, nombre: 'Sofía García', grupo: '3A' },
    { id: 6, nombre: 'Diego Álvarez', grupo: '3B' },
    { id: 7, nombre: 'Valeria Maya', grupo: '4A' },
    { id: 8, nombre: 'Bruno Díaz', grupo: '4B' },
    { id: 9, nombre: 'Chepe', grupo: '6B' }
  ],
  productos: [
    { id: 1, nombre: 'Taco de frijoles', precio: 18 },
    { id: 2, nombre: 'Refresco', precio: 22.5 },
    { id: 3, nombre: 'Pan dulce', precio: 12 },
    { id: 4, nombre: 'Café', precio: 25 },
    { id: 5, nombre: 'Sandwich', precio: 35 },
    { id: 6, nombre: 'Agua', precio: 15 },
    { id: 7, nombre: 'Galletas', precio: 14.5 },
    { id: 8, nombre: 'Yogur', precio: 20 }
  ],
  ventas: []
};

function readLocalData() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(LOCAL_DATA_KEY));
    if (saved && Array.isArray(saved.estudiantes) && Array.isArray(saved.productos)) {
      return { ...initialData, ...saved, ventas: Array.isArray(saved.ventas) ? saved.ventas : [] };
    }
  } catch {
    // Use the bundled records when storage is unavailable or invalid.
  }
  return initialData;
}

function persistLocalData(data) {
  try {
    window.localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data));
  } catch {
    // Keep the current session usable when browser storage is disabled.
  }
}

function resolveApiUrl(pathname) {
  if (!pathname.startsWith('/')) return pathname;
  if (!API_BASE) return pathname;
  return new URL(pathname, API_BASE).toString();
}

function clearForm(form) {
  if (!form) return;
  form.reset();
}

const pages = [
  { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
  { id: 'ventas', label: 'Ventas', icon: ReceiptText },
  { id: 'productos', label: 'Productos', icon: Coffee },
  { id: 'estudiantes', label: 'Estudiantes', icon: GraduationCap }
];

async function request(url, options) {
  const apiUrl = resolveApiUrl(url);
  const response = await fetch(apiUrl, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.error || `Error ${response.status} en ${apiUrl}`;
    if (response.status === 404 && !API_BASE) {
      throw new Error('La API no responde en esta URL. Inicia el backend local en puerto 3000 o configura VITE_API_URL.');
    }
    throw new Error(message);
  }
  return body;
}

function App() {
  const [activePage, setActivePage] = useState('resumen');
  const [data, setData] = useState(readLocalData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [estudiantes, productos, ventas] = await Promise.all([
        request('/api/estudiantes'),
        request('/api/productos'),
        request('/api/ventas')
      ]);
      const nextData = { estudiantes, productos, ventas };
      setData(nextData);
      persistLocalData(nextData);
      setConnected(true);
    } catch (loadError) {
      setConnected(false);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveForm(event, endpoint, transform, successMessage) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await request(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transform(values))
      });
      form.reset();
      setNotice(successMessage);
      await loadData();
    } catch (saveError) {
      const collection = endpoint === '/api/estudiantes'
        ? 'estudiantes'
        : endpoint === '/api/productos'
          ? 'productos'
          : null;
      if (!collection) {
        setError(saveError.message);
        return;
      }

      const record = transform(values);
      setData((current) => {
        const id = Math.max(0, ...current[collection].map((item) => Number(item.id) || 0)) + 1;
        const nextData = { ...current, [collection]: [...current[collection], { id, ...record }] };
        persistLocalData(nextData);
        return nextData;
      });
      setConnected(false);
      form.reset();
      setNotice(`${successMessage} Guardado en este navegador.`);
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord(endpoint, description) {
    setConfirmDelete({ endpoint, description });
  }

  async function confirmRemoval() {
    if (!confirmDelete) return;
    setError('');
    setNotice('');
    try {
      await request(confirmDelete.endpoint, { method: 'DELETE' });
      setNotice('Registro eliminado.');
      await loadData();
    } catch (removeError) {
      const match = confirmDelete.endpoint.match(/^\/api\/(estudiantes|productos)\/(\d+)$/);
      if (!match) {
        setError(removeError.message);
      } else {
        const [, collection, recordId] = match;
        setData((current) => {
          const nextData = {
            ...current,
            [collection]: current[collection].filter((item) => String(item.id) !== recordId)
          };
          persistLocalData(nextData);
          return nextData;
        });
        setConnected(false);
        setNotice('Registro eliminado de este navegador.');
      }
    } finally {
      setConfirmDelete(null);
    }
  }

  const selectedPage = pages.find((page) => page.id === activePage);
  const totalToday = data.ventas
    .filter((sale) => String(sale.fecha).slice(0, 10) === today())
    .reduce((sum, sale) => sum + Number(sale.total), 0);
  const todayCount = data.ventas.filter((sale) => String(sale.fecha).slice(0, 10) === today()).length;
  const filteredProducts = data.productos.filter((product) => product.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredStudents = data.estudiantes.filter((student) =>
    `${student.nombre} ${student.grupo}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="cafeteria-shell">
      <header className="cafeteria-header">
        <a className="cafeteria-brand" href="#inicio" onClick={() => setActivePage('resumen')}>
          <span className="cafeteria-brand__mark"><Coffee size={24} strokeWidth={2.2} /></span>
          <span>
            <span className="cafeteria-brand__name">La Cafetería</span>
            <span className="cafeteria-brand__caption">Administración escolar</span>
          </span>
        </a>
        <nav className="cafeteria-nav" aria-label="Navegación principal">
          {pages.map(({ id, label, icon: Icon }) => (
            <button
              className={activePage === id ? 'nav-link is-active' : 'nav-link'}
              key={id}
              onClick={() => { setActivePage(id); setSearchTerm(''); }}
              type="button"
            >
              <Icon size={17} /> <span>{label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="cafeteria-main">
        <div className="cafeteria-page-heading">
          <div>
            <p className="eyebrow">CONTROL ESCOLAR · {new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date())}</p>
            <h1>{activePage === 'resumen' ? 'Buenos días' : selectedPage.label}</h1>
            <p>{activePage === 'resumen' ? 'Así marcha la cafetería hoy.' : `Administra ${selectedPage.label.toLowerCase()} de la cafetería.`}</p>
          </div>
          <button className="cafeteria-button cafeteria-button--secondary refresh-button" onClick={loadData} disabled={loading} type="button">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Actualizar
          </button>
        </div>

        {loading && !data.productos.length && !data.estudiantes.length ? (
          <div className="loading-state"><LoaderCircle className="spin" size={28} /><span>Conectando con la cafetería...</span></div>
        ) : (
          <>
            {activePage === 'resumen' && (
              <>
                <section className="stats-grid" aria-label="Resumen del día">
                  <article className="stat-card stat-card--green">
                    <div className="stat-card__top"><span>Venta de hoy</span><span className="stat-icon"><ReceiptText size={19} /></span></div>
                    <strong>{currency.format(totalToday)}</strong>
                    <small><ArrowUpRight size={14} /> {todayCount} {todayCount === 1 ? 'venta registrada' : 'ventas registradas'}</small>
                  </article>
                  <article className="stat-card stat-card--yellow">
                    <div className="stat-card__top"><span>Productos</span><span className="stat-icon"><Coffee size={19} /></span></div>
                    <strong>{data.productos.length}</strong>
                    <small>En el catálogo escolar</small>
                  </article>
                  <article className="stat-card stat-card--coral">
                    <div className="stat-card__top"><span>Estudiantes</span><span className="stat-icon"><GraduationCap size={19} /></span></div>
                    <strong>{data.estudiantes.length}</strong>
                    <small>En el padrón</small>
                  </article>
                </section>
                <section className="dashboard-grid">
                  <div className="cafeteria-panel">
                    <div className="cafeteria-panel__heading">
                      <div><p className="eyebrow">MOVIMIENTOS</p><h2>Ventas recientes</h2></div>
                      <button className="text-button" onClick={() => setActivePage('ventas')} type="button">Ver todas <ArrowUpRight size={15} /></button>
                    </div>
                    <SalesTable sales={data.ventas.slice(0, 5)} onRemove={removeRecord} />
                  </div>
                  <aside className="quick-panel">
                    <div className="quick-panel__illustration"><Utensils size={27} /></div>
                    <p className="eyebrow">OPERACIÓN</p>
                    <h2>¿Qué registramos?</h2>
                    <p>Agrega una venta, actualiza el catálogo o consulta los grupos.</p>
                    <button className="cafeteria-button cafeteria-button--primary" onClick={() => setActivePage('ventas')} type="button"><Plus size={16} /> Registrar venta</button>
                    <div className="quick-panel__foot"><span><span className={connected ? 'live-dot' : 'live-dot is-offline'} /> {connected ? 'Sistema listo' : 'Sin conexión'}</span><span>{data.ventas.length} movimientos</span></div>
                  </aside>
                </section>
              </>
            )}

            {activePage === 'ventas' && (
              <div className="workspace-grid workspace-grid--sales">
                <section className="cafeteria-panel form-panel">
                  <div className="cafeteria-panel__heading"><div><p className="eyebrow">NUEVO MOVIMIENTO</p><h2>Registrar venta</h2></div><span className="form-heading-icon"><ReceiptText size={19} /></span></div>
                  <form className="record-form" onSubmit={(event) => saveForm(event, '/api/ventas', (values) => ({
                    estudiante_id: Number(values.estudiante_id), producto_id: Number(values.producto_id), cantidad: Number(values.cantidad), fecha: values.fecha
                  }), 'Venta registrada correctamente.')}>
                    <Field label="Estudiante"><select name="estudiante_id" required defaultValue=""><option value="" disabled>Selecciona estudiante</option>{data.estudiantes.map((student) => <option key={student.id} value={student.id}>{student.nombre} · {student.grupo}</option>)}</select></Field>
                    <Field label="Producto"><select name="producto_id" required defaultValue=""><option value="" disabled>Selecciona producto</option>{data.productos.map((product) => <option key={product.id} value={product.id}>{product.nombre} · {currency.format(product.precio)}</option>)}</select></Field>
                    <div className="form-row">
                      <Field label="Cantidad"><input name="cantidad" type="number" min="1" step="1" defaultValue="1" required /></Field>
                      <Field label="Fecha"><input name="fecha" type="date" defaultValue={today()} required /></Field>
                    </div>
                    {(!data.estudiantes.length || !data.productos.length) && <p className="form-hint">Agrega estudiantes y productos antes de registrar ventas.</p>}
                    <div className="form-actions">
                      <button className="cafeteria-button cafeteria-button--secondary form-submit" onClick={(event) => { event.preventDefault(); clearForm(event.currentTarget.form); }} type="button">Limpiar</button>
                      <button className="cafeteria-button cafeteria-button--primary form-submit" disabled={saving || !data.estudiantes.length || !data.productos.length} type="submit"><Plus size={17} /> {saving ? 'Guardando...' : 'Guardar venta'}</button>
                    </div>
                  </form>
                  <div className="form-note"><span className="live-dot" /> El total se calcula con el precio del producto.</div>
                </section>
                <section className="cafeteria-panel">
                  <div className="cafeteria-panel__heading"><div><p className="eyebrow">HISTORIAL</p><h2>Todas las ventas <span className="count-pill">{data.ventas.length}</span></h2></div></div>
                  <SalesTable sales={data.ventas} onRemove={removeRecord} />
                </section>
              </div>
            )}

            {activePage === 'productos' && (
              <div className="workspace-grid">
                <section className="cafeteria-panel form-panel">
                  <div className="cafeteria-panel__heading"><div><p className="eyebrow">CATÁLOGO</p><h2>Agregar producto</h2></div><span className="form-heading-icon"><Coffee size={19} /></span></div>
                  <form className="record-form" onSubmit={(event) => saveForm(event, '/api/productos', (values) => ({ nombre: values.nombre.trim(), precio: Number(values.precio) }), 'Producto agregado al catálogo.')}>
                    <Field label="Nombre"><input name="nombre" placeholder="Ej. Mollete" maxLength="100" required /></Field>
                    <Field label="Precio (USD)"><input name="precio" type="number" min="0" step="0.01" placeholder="0.00" required /></Field>
                    <div className="form-actions">
                      <button className="cafeteria-button cafeteria-button--secondary form-submit" onClick={(event) => { event.preventDefault(); clearForm(event.currentTarget.form); }} type="button">Limpiar</button>
                      <button className="cafeteria-button cafeteria-button--primary form-submit" disabled={saving} type="submit"><Plus size={17} /> {saving ? 'Guardando...' : 'Agregar producto'}</button>
                    </div>
                  </form>
                </section>
                <section className="cafeteria-panel">
                  <div className="cafeteria-panel__heading list-heading">
                    <div><p className="eyebrow">DISPONIBLES</p><h2>Productos <span className="count-pill">{data.productos.length}</span></h2></div>
                    <label className="search-control"><Search size={16} /><input aria-label="Buscar productos" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar" value={searchTerm} /></label>
                  </div>
                  <ProductsTable products={filteredProducts} onRemove={removeRecord} />
                </section>
              </div>
            )}

            {activePage === 'estudiantes' && (
              <div className="workspace-grid">
                <section className="cafeteria-panel form-panel">
                  <div className="cafeteria-panel__heading"><div><p className="eyebrow">PADRÓN ESCOLAR</p><h2>Agregar estudiante</h2></div><span className="form-heading-icon form-heading-icon--coral"><GraduationCap size={20} /></span></div>
                  <form className="record-form" onSubmit={(event) => saveForm(event, '/api/estudiantes', (values) => ({ nombre: values.nombre.trim(), grupo: values.grupo.trim() }), 'Estudiante agregado al padrón.')}>
                    <Field label="Nombre completo"><input name="nombre" placeholder="Ej. Ana López" maxLength="100" required /></Field>
                    <Field label="Grupo"><input name="grupo" placeholder="Ej. 1A" maxLength="50" required /></Field>
                    <div className="form-actions">
                      <button className="cafeteria-button cafeteria-button--secondary form-submit" onClick={(event) => { event.preventDefault(); clearForm(event.currentTarget.form); }} type="button">Limpiar</button>
                      <button className="cafeteria-button cafeteria-button--primary form-submit" disabled={saving} type="submit"><Plus size={17} /> {saving ? 'Guardando...' : 'Agregar estudiante'}</button>
                    </div>
                  </form>
                </section>
                <section className="cafeteria-panel">
                  <div className="cafeteria-panel__heading list-heading">
                    <div><p className="eyebrow">COMUNIDAD</p><h2>Estudiantes <span className="count-pill">{data.estudiantes.length}</span></h2></div>
                    <label className="search-control"><Search size={16} /><input aria-label="Buscar estudiantes" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar" value={searchTerm} /></label>
                  </div>
                  <StudentsTable students={filteredStudents} onRemove={removeRecord} />
                </section>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="app-footer"><span>CAFETERÍA ESCOLAR</span><span>Control diario · {new Date().getFullYear()}</span></footer>

      {confirmDelete && (
        <div className="confirmation-overlay" onClick={() => setConfirmDelete(null)} role="presentation">
          <div className="confirmation-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className="confirmation-header">
              <h3 id="confirm-title">Confirmación</h3>
              <button aria-label="Cerrar confirmación" className="modal-close" onClick={() => setConfirmDelete(null)} type="button">
                <X size={18} />
              </button>
            </div>
            <p className="confirmation-message">¿Eliminar {confirmDelete.description}?</p>
            <div className="confirmation-actions">
              <button className="cafeteria-button cafeteria-button--primary" onClick={confirmRemoval} type="button">Aceptar</button>
              <button className="cafeteria-button cafeteria-button--secondary" onClick={() => setConfirmDelete(null)} type="button">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return <div className="cafeteria-field"><label>{label}</label>{children}</div>;
}

function EmptyRow({ columns, children }) {
  return <tr><td colSpan={columns}><div className="cafeteria-empty">{children}</div></td></tr>;
}

function SalesTable({ sales, onRemove }) {
  return (
    <div className="cafeteria-table-wrap">
      <table className="cafeteria-table">
        <thead><tr><th>Estudiante</th><th>Producto</th><th>Fecha</th><th>Total</th><th><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>
          {sales.length ? sales.map((sale) => (
            <tr key={sale.id}>
              <td><span className="table-primary">{sale.estudiante}</span><span className="table-secondary">Grupo {sale.grupo}</span></td>
              <td>{sale.cantidad} × {sale.producto}</td>
              <td>{dateLabel.format(new Date(`${String(sale.fecha).slice(0, 10)}T12:00:00`))}</td>
              <td className="money-cell">{currency.format(sale.total)}</td>
              <td><button className="icon-button" aria-label={`Eliminar venta ${sale.id}`} onClick={() => onRemove(`/api/ventas/${sale.id}`, 'esta venta')} type="button"><Trash2 size={16} /></button></td>
            </tr>
          )) : <EmptyRow columns={5}>Aún no hay ventas registradas.</EmptyRow>}
        </tbody>
      </table>
    </div>
  );
}

function ProductsTable({ products, onRemove }) {
  return (
    <div className="cafeteria-table-wrap"><table className="cafeteria-table">
      <thead><tr><th>Producto</th><th>Precio</th><th><span className="sr-only">Acciones</span></th></tr></thead>
      <tbody>{products.length ? products.map((product) => (
        <tr key={product.id}><td><span className="table-primary">{product.nombre}</span></td><td className="money-cell">{currency.format(product.precio)}</td><td><button className="icon-button" aria-label={`Eliminar ${product.nombre}`} onClick={() => onRemove(`/api/productos/${product.id}`, `el producto ${product.nombre}`)} type="button"><Trash2 size={16} /></button></td></tr>
      )) : <EmptyRow columns={3}>No hay productos que coincidan.</EmptyRow>}</tbody>
    </table></div>
  );
}

function StudentsTable({ students, onRemove }) {
  return (
    <div className="cafeteria-table-wrap"><table className="cafeteria-table">
      <thead><tr><th>Estudiante</th><th>Grupo</th><th><span className="sr-only">Acciones</span></th></tr></thead>
      <tbody>{students.length ? students.map((student) => (
        <tr key={student.id}><td><span className="table-primary">{student.nombre}</span></td><td><span className="group-label">{student.grupo}</span></td><td><button className="icon-button" aria-label={`Eliminar a ${student.nombre}`} onClick={() => onRemove(`/api/estudiantes/${student.id}`, `a ${student.nombre}`)} type="button"><Trash2 size={16} /></button></td></tr>
      )) : <EmptyRow columns={3}>No hay estudiantes que coincidan.</EmptyRow>}</tbody>
    </table></div>
  );
}

const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'));
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<App />);