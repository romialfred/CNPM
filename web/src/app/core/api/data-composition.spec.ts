import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { adminRoutes } from '../../features/admin/admin.routes';
import { AUDIT_GATEWAY } from '../../features/admin/audit/audit-gateway';
import { DemoAuditGateway } from '../../features/admin/audit/demo-audit.gateway';
import { HttpAuditGateway } from '../../features/admin/audit/http-audit.gateway';
import { CONTRIBUTIONS_GATEWAY } from '../../features/admin/contributions/contributions-gateway';
import { DASHBOARD_GATEWAY } from '../../features/admin/dashboard/dashboard-gateway';
import { DemoDashboardGateway } from '../../features/admin/dashboard/demo-dashboard.gateway';
import { HttpDashboardGateway } from '../../features/admin/dashboard/http-dashboard.gateway';
import { ENROLLMENT_GATEWAY } from '../../features/admin/enrollment-form/enrollment-gateway';
import { MEMBER_DETAIL_GATEWAY } from '../../features/admin/member-detail/member-detail-gateway';
import { DemoGroupsGateway } from '../../features/admin/groups/demo-groups.gateway';
import { GROUPS_GATEWAY } from '../../features/admin/groups/groups-gateway';
import { HttpGroupsGateway } from '../../features/admin/groups/http-groups.gateway';
import { HttpMembersGateway } from '../../features/admin/members/http-members.gateway';
import { DemoMembersGateway } from '../../features/admin/members/demo-members.gateway';
import { MEMBERS_GATEWAY } from '../../features/admin/members/members-gateway';
import { PAYMENTS_GATEWAY } from '../../features/admin/payments/payments-gateway';
import { RECOVERY_GATEWAY } from '../../features/admin/recovery/recovery-gateway';
import { REPORTING_GATEWAY } from '../../features/admin/reporting/reporting-gateway';
import { ADMIN_SECURITY_GATEWAY } from '../../features/admin/security/admin-security-gateway';
import { DemoSettingsGateway } from '../../features/admin/settings/demo-settings.gateway';
import { HttpSettingsGateway } from '../../features/admin/settings/http-settings.gateway';
import { SETTINGS_GATEWAY } from '../../features/admin/settings/settings-gateway';
import {
  UNAVAILABLE_ADMIN_SECURITY_GATEWAY,
  UNAVAILABLE_CONTRIBUTIONS_GATEWAY,
  UNAVAILABLE_ENROLLMENT_GATEWAY,
  UNAVAILABLE_MEMBER_DETAIL_GATEWAY,
  UNAVAILABLE_PAYMENTS_GATEWAY,
  UNAVAILABLE_RECOVERY_GATEWAY,
  UNAVAILABLE_REPORTING_GATEWAY,
} from '../../features/admin/unavailable-admin-gateways';
import { authRoutes } from '../../features/auth/auth.routes';
import { AUTH_GATEWAY } from '../../features/auth/auth-gateway';
import { DemoAuthGateway } from '../../features/auth/demo-auth.gateway';
import { HttpAuthGateway } from '../../features/auth/http-auth.gateway';
import { DemoMemberHomeGateway } from '../../features/member/home/demo-member-home.gateway';
import { MEMBER_HOME_GATEWAY } from '../../features/member/home/member-home-gateway';
import { memberRoutes } from '../../features/member/member.routes';
import { UNAVAILABLE_MEMBER_HOME_GATEWAY } from '../../features/member/unavailable-member-gateways';
import { DemoHomeGateway } from '../../features/public/home/demo-home.gateway';
import { HOME_GATEWAY } from '../../features/public/home/home-gateway';
import { HttpHomeGateway } from '../../features/public/home/http-home.gateway';
import { publicRoutes, showcaseRoutes } from '../../features/public/public.routes';
import { DemoShowcaseGateway } from '../../features/public/showcase/demo-showcase.gateway';
import { SHOWCASE_GATEWAY } from '../../features/public/showcase/showcase-gateway';
import { UNAVAILABLE_SHOWCASE_GATEWAY } from '../../features/public/unavailable-public-gateways';
import { DemoSessionGateway } from '../../layout/admin-shell/demo-session.gateway';
import { HttpSessionGateway } from '../../layout/admin-shell/http-session.gateway';
import { SESSION_GATEWAY } from '../../layout/admin-shell/session-gateway';
import { provideCnpmApi, type CnpmDataMode } from './api.config';

function configure(mode: CnpmDataMode): void {
  TestBed.configureTestingModule({
    providers: [
      provideCnpmApi({ dataMode: mode }),
      provideHttpClient(),
      provideHttpClientTesting(),
      ...(adminRoutes[0]?.providers ?? []),
      ...(authRoutes[0]?.providers ?? []),
      ...(publicRoutes.find((route) => route.path === '')?.providers ?? []),
      ...(showcaseRoutes[0]?.providers ?? []),
      ...(memberRoutes[0]?.providers ?? []),
    ],
  });
}

describe('composition des sources applicatives', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('assemble exclusivement les adaptateurs fictifs dans le profil demo', () => {
    configure('demo');
    expect(TestBed.inject(SESSION_GATEWAY)).toBeInstanceOf(DemoSessionGateway);
    expect(TestBed.inject(AUTH_GATEWAY)).toBeInstanceOf(DemoAuthGateway);
    expect(TestBed.inject(MEMBERS_GATEWAY)).toBeInstanceOf(DemoMembersGateway);
    expect(TestBed.inject(GROUPS_GATEWAY)).toBeInstanceOf(DemoGroupsGateway);
    expect(TestBed.inject(AUDIT_GATEWAY)).toBeInstanceOf(DemoAuditGateway);
    expect(TestBed.inject(SETTINGS_GATEWAY)).toBeInstanceOf(DemoSettingsGateway);
    expect(TestBed.inject(DASHBOARD_GATEWAY)).toBeInstanceOf(DemoDashboardGateway);
    expect(TestBed.inject(HOME_GATEWAY)).toBeInstanceOf(DemoHomeGateway);
    expect(TestBed.inject(SHOWCASE_GATEWAY)).toBeInstanceOf(DemoShowcaseGateway);
    expect(TestBed.inject(MEMBER_HOME_GATEWAY)).toBeInstanceOf(DemoMemberHomeGateway);
  });

  it('ne laisse aucune feature non raccordée retomber sur une fixture en profil http', () => {
    configure('http');
    expect(TestBed.inject(SESSION_GATEWAY)).toBeInstanceOf(HttpSessionGateway);
    expect(TestBed.inject(AUTH_GATEWAY)).toBeInstanceOf(HttpAuthGateway);
    expect(TestBed.inject(MEMBERS_GATEWAY)).toBeInstanceOf(HttpMembersGateway);
    expect(TestBed.inject(GROUPS_GATEWAY)).toBeInstanceOf(HttpGroupsGateway);
    expect(TestBed.inject(AUDIT_GATEWAY)).toBeInstanceOf(HttpAuditGateway);
    expect(TestBed.inject(SETTINGS_GATEWAY)).toBeInstanceOf(HttpSettingsGateway);
    expect(TestBed.inject(DASHBOARD_GATEWAY)).toBeInstanceOf(HttpDashboardGateway);
    expect(TestBed.inject(MEMBER_DETAIL_GATEWAY)).toBe(UNAVAILABLE_MEMBER_DETAIL_GATEWAY);
    expect(TestBed.inject(ENROLLMENT_GATEWAY)).toBe(UNAVAILABLE_ENROLLMENT_GATEWAY);
    expect(TestBed.inject(CONTRIBUTIONS_GATEWAY)).toBe(UNAVAILABLE_CONTRIBUTIONS_GATEWAY);
    expect(TestBed.inject(PAYMENTS_GATEWAY)).toBe(UNAVAILABLE_PAYMENTS_GATEWAY);
    expect(TestBed.inject(RECOVERY_GATEWAY)).toBe(UNAVAILABLE_RECOVERY_GATEWAY);
    expect(TestBed.inject(REPORTING_GATEWAY)).toBe(UNAVAILABLE_REPORTING_GATEWAY);
    expect(TestBed.inject(ADMIN_SECURITY_GATEWAY)).toBe(UNAVAILABLE_ADMIN_SECURITY_GATEWAY);
    expect(TestBed.inject(HOME_GATEWAY)).toBeInstanceOf(HttpHomeGateway);
    expect(TestBed.inject(SHOWCASE_GATEWAY)).toBe(UNAVAILABLE_SHOWCASE_GATEWAY);
    expect(TestBed.inject(MEMBER_HOME_GATEWAY)).toBe(UNAVAILABLE_MEMBER_HOME_GATEWAY);
  });
});
