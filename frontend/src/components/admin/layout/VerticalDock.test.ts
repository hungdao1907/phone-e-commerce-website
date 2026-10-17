import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { matchPath } from 'react-router-dom';
import { canSeeDockItem, dashboardViewPath, isQuotationView, QUOTATION_VIEW_IDS } from './dashboard-navigation';

// The real auth store reads browser storage when first imported. Keep this
// render-only regression suite isolated from browser sessions and the network.
const storage = { getItem: () => null, setItem() {}, removeItem() {}, clear() {}, key: () => null, length: 0 };
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: storage, configurable: true });
const { VerticalDock, DOCK_ITEMS } = await import('./VerticalDock');
const { useAuthStore } = await import('../../../store/authStore');

function renderDock(role: string | undefined) {
  const session = { token: role ? 'fixture-token' : null, user: role ? { id: 'fixture-user', username: 'Fixture', role } : null };
  // React server rendering reads Zustand's initial snapshot rather than its
  // current browser snapshot. Both belong only to this isolated test process.
  Object.assign(useAuthStore.getInitialState(), session);
  useAuthStore.setState(session);
  return renderToStaticMarkup(React.createElement(VerticalDock, { activeView: 'quotations', onNavigate() {} }));
}

test('Admin, Superadmin and Staff can find the Chatbot quotations menu in the real sidebar', () => {
  for (const role of ['admin', 'superadmin', 'staff']) {
    assert.ok(renderDock(role).includes('Báo giá Chatbot'), `${role} must retain the quotation menu`);
  }
});

test('Staff sidebar hides personnel and calendar without hiding operational menus', () => {
  const html = renderDock('staff');
  assert.ok(!html.includes('<span>Nhân sự</span>'));
  assert.ok(!html.includes('<span>Lịch</span>'));
  for (const label of ['Sản phẩm', 'Đơn hàng', 'CRM', 'Marketing']) assert.ok(html.includes(label));
});

test('Admin and Superadmin retain personnel and calendar; other roles do not gain quotation access', () => {
  for (const role of ['admin', 'superadmin']) {
    const html = renderDock(role);
    assert.ok(html.includes('<span>Nhân sự</span>'));
    assert.ok(html.includes('<span>Lịch</span>'));
  }
  for (const role of ['customer', 'manager', 'user', 'unknown', undefined]) {
    assert.ok(!renderDock(role).includes('Báo giá Chatbot'), `${role} cannot gain quotation menu access`);
    assert.equal(canSeeDockItem(role, 'quotations'), false);
  }
});

test('the rendered dock configuration retains exactly the three quotation submenus', () => {
  const quotations = DOCK_ITEMS.find(item => item.id === 'quotations');
  assert.ok(quotations);
  assert.equal(quotations.label, 'Báo giá Chatbot');
  assert.deepEqual(quotations.subItems, [
    { id: 'quotations-list', label: 'Danh sách báo giá' },
    { id: 'quotations-pending', label: 'Báo giá chờ duyệt' },
    { id: 'quotations-processed', label: 'Báo giá đã xử lý' },
  ]);
  assert.deepEqual([quotations.id, ...quotations.subItems.map(item => item.id)], [...QUOTATION_VIEW_IDS]);
});

test('quotation root and every submenu resolve through the real dashboard route', () => {
  const appSource = readFileSync(new URL('../../../App.tsx', import.meta.url), 'utf8');
  const dashboardRoute = appSource.match(/<Route path="([^"]+)" element=\{<DashboardLayout/)?.[1];
  assert.ok(dashboardRoute, 'App must keep the dashboard route mounted');
  assert.equal(dashboardViewPath('dashboard'), '/dashboard');
  for (const view of QUOTATION_VIEW_IDS) {
    const path = dashboardViewPath(view);
    assert.equal(path, `/dashboard/${view}`);
    assert.equal(matchPath(dashboardRoute, path)?.params.view, view);
    assert.equal(isQuotationView(view), true);
  }
  assert.equal(isQuotationView('settings'), false);
  assert.equal(isQuotationView('quotations-unknown'), false);
});

test('dashboard navigation preserves separate Admin assignment and Staff quotation screens and tabs', () => {
  const layout = readFileSync(new URL('./DashboardLayout.tsx', import.meta.url), 'utf8');
  const staffScreen = readFileSync(new URL('../../quotations/StaffQuotations.tsx', import.meta.url), 'utf8');
  const adminScreen = readFileSync(new URL('../../quotations/AdminQuotationAssignments.tsx', import.meta.url), 'utf8');
  assert.ok(layout.includes('navigate(dashboardViewPath(newView))'));
  assert.ok(layout.includes('isQuotationView(activeView)'));
  assert.ok(layout.includes("const isStaff = role === 'staff'"));
  assert.ok(layout.includes("const isAdmin = role === 'admin' || role === 'superadmin'"));
  assert.ok(layout.includes('isStaff ? <StaffQuotations initialTab={activeView} /> : isAdmin ? <AdminQuotationAssignments />'));
  assert.ok(staffScreen.includes("initialTab === 'quotations-pending' ? 'pending' : initialTab === 'quotations-processed' ? 'processed' : 'all'"));
  assert.ok(staffScreen.includes("'/api/staff/quotations'"));
  assert.ok(!staffScreen.includes('/api/admin/quotations'));
  assert.ok(adminScreen.includes("'/api/admin/quotations'"));
  assert.ok(adminScreen.includes('/assign`'));
});
