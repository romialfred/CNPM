# Catalogue des composants

Le catalogue contient **74 composants**. La source machine est `data/component-catalog.json`.

| ID | Catégorie | Composant | Plateformes | Priorité | États obligatoires |
|---|---|---|---|---|---|
| LAY-001 | Structure | `AdminShell` | Web | P0 | expanded,collapsed,mobile-drawer |
| LAY-002 | Structure | `MemberPortalShell` | Web | P0 | desktop,tablet,mobile |
| LAY-003 | Structure | `PublicShell` | Web | P0 | transparent,solid,menu-open |
| LAY-004 | Structure | `MobileAppShell` | Mobile | P0 | online,offline,badge |
| LAY-005 | Structure | `PageHeader` | Web/Mobile | P0 | default,with-actions,with-breadcrumb |
| LAY-006 | Structure | `Section` | Web/Mobile | P0 | standard,dense,full-bleed |
| LAY-007 | Structure | `Card` | Web/Mobile | P0 | default,interactive,selected,disabled |
| LAY-008 | Structure | `SplitPane` | Web | P1 | 50-50,master-detail,resizable |
| NAV-001 | Navigation | `SidebarNavigation` | Web | P0 | expanded,collapsed,mobile |
| NAV-002 | Navigation | `TopBar` | Web | P0 | default,search-open,profile-open |
| NAV-003 | Navigation | `PublicHeader` | Web | P0 | desktop,mobile,scrolled |
| NAV-004 | Navigation | `BottomNavigation` | Mobile | P0 | default,active,badged |
| NAV-005 | Navigation | `Breadcrumb` | Web | P0 | default,truncated |
| NAV-006 | Navigation | `Tabs` | Web/Mobile | P0 | default,scrollable,disabled |
| NAV-007 | Navigation | `Stepper` | Web/Mobile | P0 | current,complete,error,disabled |
| NAV-008 | Navigation | `Pagination` | Web | P0 | default,compact,server |
| ACT-001 | Actions | `Button` | Web/Mobile | P0 | default,hover,focus,pressed,loading,disabled |
| ACT-002 | Actions | `IconButton` | Web/Mobile | P0 | default,hover,focus,pressed,disabled |
| ACT-003 | Actions | `SplitButton` | Web | P1 | closed,open,disabled |
| ACT-004 | Actions | `ButtonGroup` | Web | P1 | single,multi |
| ACT-005 | Actions | `Link` | Web/Mobile | P0 | default,hover,focus,visited |
| FRM-001 | Formulaire | `TextInput` | Web/Mobile | P0 | empty,filled,focus,error,success,disabled,readonly |
| FRM-002 | Formulaire | `PasswordInput` | Web/Mobile | P0 | hidden,visible,error |
| FRM-003 | Formulaire | `TextArea` | Web/Mobile | P0 | empty,filled,focus,error,disabled |
| FRM-004 | Formulaire | `Select` | Web/Mobile | P0 | closed,open,selected,error,disabled |
| FRM-005 | Formulaire | `Autocomplete` | Web/Mobile | P0 | idle,typing,loading,no-result,selected,error |
| FRM-006 | Formulaire | `DatePicker` | Web/Mobile | P0 | empty,selected,range,error,disabled |
| FRM-007 | Formulaire | `Checkbox` | Web/Mobile | P0 | unchecked,checked,indeterminate,disabled |
| FRM-008 | Formulaire | `RadioGroup` | Web/Mobile | P0 | default,selected,disabled,error |
| FRM-009 | Formulaire | `Switch` | Web/Mobile | P1 | off,on,disabled |
| FRM-010 | Formulaire | `FileUploader` | Web/Mobile | P0 | idle,drag,uploading,success,error,virus-scan |
| FRM-011 | Formulaire | `OtpInput` | Web/Mobile | P0 | empty,partial,complete,error,expired |
| FRM-012 | Formulaire | `SearchField` | Web/Mobile | P0 | idle,typing,loading,results,no-result |
| FRM-013 | Formulaire | `FilterBar` | Web | P0 | collapsed,expanded,active-filters |
| FRM-014 | Formulaire | `FormSection` | Web/Mobile | P0 | default,complete,error |
| FRM-015 | Formulaire | `StickyFormActions` | Web/Mobile | P0 | default,saving,error |
| DAT-001 | Donnees | `DataTable` | Web | P0 | loading,empty,error,dense,selection,sort |
| DAT-002 | Donnees | `ResponsiveRecordList` | Web/Mobile | P0 | table,cards,empty |
| DAT-003 | Donnees | `ColumnSelector` | Web | P1 | closed,open,saved |
| DAT-004 | Donnees | `BulkActionBar` | Web | P0 | hidden,visible,loading |
| DAT-005 | Donnees | `DefinitionList` | Web/Mobile | P0 | horizontal,stacked |
| DAT-006 | Donnees | `Timeline` | Web/Mobile | P0 | default,compact,loading |
| DAT-007 | Donnees | `Metric` | Web/Mobile | P0 | default,trend,warning,critical |
| DAT-008 | Donnees | `Progress` | Web/Mobile | P0 | determinate,indeterminate,complete,error |
| FDB-001 | Feedback | `StatusBadge` | Web/Mobile | P0 | neutral,info,success,warning,error |
| FDB-002 | Feedback | `Alert` | Web/Mobile | P0 | info,success,warning,error |
| FDB-003 | Feedback | `Toast` | Web/Mobile | P0 | success,error,info,with-action |
| FDB-004 | Feedback | `InlineErrorSummary` | Web/Mobile | P0 | hidden,visible |
| FDB-005 | Feedback | `Skeleton` | Web/Mobile | P0 | text,table,card,chart |
| FDB-006 | Feedback | `EmptyState` | Web/Mobile | P0 | first-use,no-results,no-data |
| FDB-007 | Feedback | `ErrorState` | Web/Mobile | P0 | recoverable,forbidden,not-found,offline |
| OVR-001 | Superposition | `Dialog` | Web/Mobile | P0 | open,confirm,danger,loading |
| OVR-002 | Superposition | `Drawer` | Web/Mobile | P0 | left,right,bottom |
| OVR-003 | Superposition | `Popover` | Web | P1 | closed,open |
| OVR-004 | Superposition | `Tooltip` | Web | P1 | hidden,visible |
| VIS-001 | Visualisation | `ChartContainer` | Web/Mobile | P0 | loading,empty,error,export |
| VIS-002 | Visualisation | `KpiStrip` | Web | P0 | default,compact,scroll |
| VIS-003 | Visualisation | `MapPanel` | Web | P1 | loading,data,no-data |
| VIS-004 | Visualisation | `InsightPanel` | Web | P1 | facts,anomalies,recommendations |
| DOM-001 | Metier | `MemberIdentityHeader` | Web/Mobile | P0 | active,dormant,prospect,suspended |
| DOM-002 | Metier | `ContributionSummary` | Web/Mobile | P0 | paid,partial,late,not-due |
| DOM-003 | Metier | `PaymentChannelBadge` | Web/Mobile | P0 | mobile-money,bank,cash,cheque |
| DOM-004 | Metier | `ReconciliationPanel` | Web | P0 | unmatched,partial,matched,exception |
| DOM-005 | Metier | `ReceiptPreview` | Web/Mobile | P0 | draft,issued,void,unavailable |
| DOM-006 | Metier | `CampaignBuilder` | Web | P1 | audience,message,cadence,schedule,review |
| DOM-007 | Metier | `RequestConversation` | Web/Mobile | P0 | open,pending,resolved,closed |
| DOM-008 | Metier | `DocumentCard` | Web/Mobile | P0 | available,processing,rejected,expired |
| DOM-009 | Metier | `MemberShowcaseHero` | Web | P0 | verified,unverified,expired |
| DOM-010 | Metier | `ShowcaseActivityCard` | Web | P0 | default,featured,no-image |
| DOM-011 | Metier | `ShowcaseProjectCard` | Web | P0 | default,featured,no-image |
| DOM-012 | Metier | `ShowcaseGallery` | Web | P1 | grid,lightbox,empty |
| DOM-013 | Metier | `ShowcaseEditor` | Web | P0 | draft,invalid,preview,publishing,published |
| DOM-014 | Metier | `VerificationBadge` | Web/Mobile | P0 | verified,pending,expired,suspended |
| DOM-015 | Metier | `AgentAssignmentCard` | Web | P1 | assigned,unassigned,unavailable |

## Règle de construction

- Chaque composant P0 doit posséder une story Storybook, des tests d’interaction, des tests axe et au moins une capture de référence.
- Les styles viennent exclusivement des tokens.
- Un composant métier orchestre des composants génériques ; il ne duplique pas leurs comportements.
- Les API publiques de composants sont documentées et stables.
- Les variantes non prévues doivent être ajoutées au catalogue avant usage.
