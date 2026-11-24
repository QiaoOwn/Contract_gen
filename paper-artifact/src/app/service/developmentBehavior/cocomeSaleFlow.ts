import {formatStructuredRequirement, getBenchmarkRequirement} from '@/rm2pt/benchmarkRequirements';
import fs from 'node:fs';
import {narrativeDevelopmentProfile} from './narrativeDevelopmentProfiles';
import {runFiniteScenarios, type FiniteObservation} from './finiteScenarioReport';
import {cocomeItemSources} from './cocomeItemSpecification';
import type {DevelopmentObligation, DevelopmentRegistration} from './types';

type Entity = Record<string, unknown>;
type Ctor = new () => Entity;
type Module = Record<string, unknown> & {getRepository: (ctor: Ctor) => Entity[]};
const clarification = {id: 'project-owner-clarification',
  path: 'data/benchmark/rm2pt_authoritative_114_v2/FREEZE_NOTES.md',
  sha256: 'e073b007fce3ffe93329f455d3ec06be7a47777d2ce3bb24d316b9fb65666885',
  note: 'Approved input clarification; the upstream RM2PT source remains unchanged.'};
const v4Decision = {id: 'owner-v4-adjudication',
  path: 'data/benchmark/rm2pt_authoritative_114_v4/OWNER_ADJUDICATIONS.md',
  sha256: '0b9b65324c69d6b94651cbdaf682719a961e292447d19bfbeabedd7b4945cda0',
  note: 'Quantity bound is an approved laboratory precondition, not original RM2PT text.'};
const obligation = (id: string, clause: DevelopmentObligation['clause'], requirement: string,
  documentLine: number, modelLine: number, modelFeatures: string[], approved = false): DevelopmentObligation =>
  ({id, clause, requirement, documentLine, modelLines: [modelLine, modelLine], modelFeatures,
    ...(approved ? {requirementSourceId: clarification.id,
      evidenceNote: 'Project-owner-approved input clarification; source postcondition relies on this object.'} : {})});
const check = (id: string, observed: unknown, expected: unknown): FiniteObservation =>
  ({obligationId: id, passed: Object.is(observed, expected), observed, expected});
const normalize = (text: string) => text.replaceAll('\r\n', '\n').trim();
const sources = [...cocomeItemSources, clarification, v4Decision];

const enterObligations: DevelopmentObligation[] = [
  obligation('P01', 'precondition', 'The current Sale exists.', 2113, 428, ['self.CurrentSale']),
  obligation('P02', 'precondition', 'The current Sale is incomplete.', 2114, 429, ['Sale.IsComplete']),
  obligation('P03', 'precondition', 'An Item with the scanned barcode exists.', 2115, 430, ['Item.Barcode', '$parameter.barcode']),
  obligation('P04', 'precondition', 'The scanned Item has positive stock.', 2116, 431, ['Item.StockNumber']),
  {...obligation('P05', 'precondition', 'The entered quantity does not exceed stock at operation entry.', 11, 431,
    ['Item.StockNumber', '$parameter.quantity']), requirementSourceId: v4Decision.id,
    evidenceNote: 'Owner-approved laboratory condition; not an original RM2PT precondition.'},
  obligation('Q01', 'postcondition', 'Create and store a new SalesLineItem.', 2133, 449, ['SalesLineItem']),
  obligation('Q02', 'postcondition', 'The new line becomes CurrentSaleLine.', 14, 450, ['self.CurrentSaleLine'], true),
  obligation('Q03', 'postcondition', 'The line refers to the current Sale.', 2135, 451, ['SalesLineItem.BelongedSale']),
  obligation('Q04', 'postcondition', 'The Sale contains the new line.', 2136, 452, ['Sale.ContainedSalesLine']),
  obligation('Q05', 'postcondition', 'The line records the supplied quantity.', 2137, 453, ['SalesLineItem.Quantity']),
  obligation('Q06', 'postcondition', 'The line refers to the selected Item.', 2138, 454, ['SalesLineItem.BelongedItem']),
  obligation('Q07', 'postcondition', 'Item stock decreases from its pre-state by the supplied quantity.', 2139, 455, ['Item.StockNumber']),
  obligation('Q08', 'postcondition', 'The line subtotal is Item price times quantity.', 2140, 456, ['SalesLineItem.Subamount', 'Item.Price']),
  obligation('Q09', 'postcondition', 'Return true.', 2142, 458, ['$result']),
];
const enterCases = ['second-item', 'first-item', 'no-sale', 'complete-sale', 'no-item', 'zero-stock', 'excess-stock'] as const;
const enterScenarios = enterCases.map(key => ({id: `dev-enter-item-${key}`,
  rejectObligation: ({'no-sale': 'P01', 'complete-sale': 'P02', 'no-item': 'P03', 'zero-stock': 'P04', 'excess-stock': 'P05'} as Record<string, string>)[key],
  obligationIds: key.startsWith('no-') || key === 'complete-sale' || key === 'zero-stock' || key === 'excess-stock'
    ? [({'no-sale': 'P01', 'complete-sale': 'P02', 'no-item': 'P03', 'zero-stock': 'P04', 'excess-stock': 'P05'} as Record<string, string>)[key]]
    : enterObligations.map(item => item.id)}));
export const cocomeEnterItem: DevelopmentRegistration = {
  id: 'CoCoME_processSale_enterItem', project: 'CoCoME', useCase: 'processSale', operation: 'enterItem',
  schemaVersion: 'development-cocome-enter-item-v2', reviewStatus: 'pending-user-review',
  fixedClock: '2026-01-15T12:00:00+08:00', sources,
  requirementSourceId: 'requirement-document', modelSourceId: 'upstream-model',
  obligations: enterObligations, scenarios: enterScenarios,
  moduleExports: {Item: 'function', Sale: 'function', SalesLineItem: 'function',
    ProcessSaleService_AutoGenerated: 'function', getRepository: 'function'},
  run(candidate, {requirementText}) {
    const expected = fs.readFileSync('data/benchmark/rm2pt_authoritative_114_v4/operations.jsonl', 'utf8')
      .split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
      .find(row => row.id === this.id)?.description;
    if (!narrativeDevelopmentProfile(this.id,requirementText)&&normalize(requirementText) !== normalize(expected)) throw new Error('CoCoME enterItem input differs from approved v2 requirement');
    const m = candidate as Module;
    return runFiniteScenarios({id: this.id, schemaVersion: this.schemaVersion, obligations: enterObligations}, enterScenarios, scenario => {
      const key = enterCases.find(item => scenario.id.endsWith(item))!;
      const Item = m.Item as Ctor, Sale = m.Sale as Ctor, Line = m.SalesLineItem as Ctor;
      const items = m.getRepository(Item), sales = m.getRepository(Sale), lines = m.getRepository(Line);
      items.splice(0); sales.splice(0); lines.splice(0);
      const other = Object.assign(new Item(), {Barcode: 99, StockNumber: 12, Price: 1.25});
      const target = Object.assign(new Item(), {Barcode: 41, StockNumber: key === 'zero-stock' ? 0 : 7, Price: 3.5});
      items.push(other); if (key !== 'no-item') items.push(target);
      const sale = Object.assign(new Sale(), {IsComplete: key === 'complete-sale', ContainedSalesLine: [] as Entity[]});
      sales.push(sale);
      const Service = m.ProcessSaleService_AutoGenerated as Ctor, service = new Service();
      if (key !== 'no-sale') service.CurrentSale = sale;
      const barcode = key === 'first-item' ? 99 : 41, selected = key === 'first-item' ? other : target;
      const quantity = key === 'excess-stock' ? 8 : 2, stockBefore = selected.StockNumber as number;
      const admitted = [key !== 'no-sale', !sale.IsComplete, key === 'first-item' || key !== 'no-item', selected.StockNumber > 0,
        quantity <= stockBefore];
      const line = () => lines[0];
      const state = (): FiniteObservation[] => [
        check('Q01', lines.length, 1), check('Q02', service.CurrentSaleLine === line(), true),
        check('Q03', line()?.BelongedSale === sale, true),
        check('Q04', (sale.ContainedSalesLine as Entity[]).includes(line()), true),
        check('Q05', line()?.Quantity, quantity), check('Q06', line()?.BelongedItem === selected, true),
        check('Q07', selected.StockNumber, stockBefore - quantity),
        check('Q08', line()?.Subamount, Number(selected.Price) * quantity),
      ];
      return {invoke: () => (service.enterItem as (barcode: number, quantity: number) => unknown)(barcode, quantity),
        observePrecondition: id => ({satisfied: admitted[Number(id.slice(1)) - 1],
          expected: enterObligations[Number(id.slice(1)) - 1].requirement, observed: admitted[Number(id.slice(1)) - 1]}),
        observeAfterPostcheckFailure: state,
        observe: result => [
          ...enterObligations.slice(0, 5).map((item, index) => check(item.id, admitted[index], true)),
          ...state(), check('Q09', result, true),
        ]};
    });
  },
};

const cashObligations: DevelopmentObligation[] = [
  obligation('P01', 'precondition', 'The current Sale exists.', 2275, 507, ['self.CurrentSale']),
  obligation('P02', 'precondition', 'The current Sale is incomplete.', 2276, 508, ['Sale.IsComplete']),
  obligation('P03', 'precondition', 'The current Sale is ready for payment.', 2277, 509, ['Sale.IsReadytoPay']),
  obligation('P04', 'precondition', 'Tendered amount covers the Sale amount.', 2278, 510, ['$parameter.amount', 'Sale.Amount']),
  obligation('P05', 'precondition', 'A current Store exists.', 15, 533, ['self.CurrentStore'], true),
  obligation('Q01', 'postcondition', 'Create and store a CashPayment.', 2293, 529, ['CashPayment']),
  obligation('Q02', 'postcondition', 'The payment records the tendered amount.', 2294, 530, ['CashPayment.AmountTendered']),
  obligation('Q03', 'postcondition', 'The payment refers to the current Sale.', 2295, 531, ['CashPayment.BelongedSale']),
  obligation('Q04', 'postcondition', 'The Sale refers to the new payment.', 2296, 532, ['Sale.AssoicatedPayment']),
  obligation('Q05', 'postcondition', 'The Sale belongs to the current Store.', 2297, 533, ['Sale.Belongedstore']),
  obligation('Q06', 'postcondition', 'The current Store contains the Sale.', 2298, 534, ['Store.Sales']),
  obligation('Q07', 'postcondition', 'The Sale is complete.', 2299, 535, ['Sale.IsComplete']),
  obligation('Q08', 'postcondition', 'The Sale timestamp is the execution time.', 2300, 536, ['Sale.Time']),
  obligation('Q09', 'postcondition', 'Payment balance is tendered amount minus Sale amount.', 2301, 537, ['CashPayment.Balance', 'Sale.Amount']),
  obligation('Q10', 'postcondition', 'Return true.', 2303, 539, ['$result']),
];
const cashCases = ['exact', 'change', 'no-sale', 'complete-sale', 'not-ready', 'insufficient', 'no-store'] as const;
const cashRejections: Record<string, string> = {'no-sale': 'P01', 'complete-sale': 'P02', 'not-ready': 'P03',
  insufficient: 'P04', 'no-store': 'P05'};
const cashScenarios = cashCases.map(key => ({id: `dev-cash-payment-${key}`,
  rejectObligation: cashRejections[key], obligationIds: cashRejections[key] ? [cashRejections[key]] : cashObligations.map(item => item.id)}));
export const cocomeCashPayment: DevelopmentRegistration = {
  id: 'CoCoME_processSale_makeCashPayment', project: 'CoCoME', useCase: 'processSale', operation: 'makeCashPayment',
  schemaVersion: 'development-cocome-cash-payment-v2', reviewStatus: 'pending-user-review',
  fixedClock: '2026-01-15T12:00:00+08:00', sources,
  requirementSourceId: 'requirement-document', modelSourceId: 'upstream-model',
  obligations: cashObligations, scenarios: cashScenarios,
  moduleExports: {Sale: 'function', Store: 'function', CashPayment: 'function',
    ProcessSaleService_AutoGenerated: 'function', getRepository: 'function'},
  run(candidate, {requirementText}) {
    const expected = formatStructuredRequirement(getBenchmarkRequirement('CoCoME', 'processSale', 'makeCashPayment'));
    if (!narrativeDevelopmentProfile(this.id,requirementText)&&normalize(requirementText) !== normalize(expected)) throw new Error('CoCoME makeCashPayment input differs from approved v2 requirement');
    const m = candidate as Module;
    return runFiniteScenarios({id: this.id, schemaVersion: this.schemaVersion, obligations: cashObligations}, cashScenarios, scenario => {
      const key = cashCases.find(item => scenario.id.endsWith(item))!;
      const Sale = m.Sale as Ctor, Store = m.Store as Ctor, CashPayment = m.CashPayment as Ctor;
      const sales = m.getRepository(Sale), stores = m.getRepository(Store), payments = m.getRepository(CashPayment);
      sales.splice(0); stores.splice(0); payments.splice(0);
      const sale = Object.assign(new Sale(), {Amount: 6.5, IsComplete: key === 'complete-sale',
        IsReadytoPay: key !== 'not-ready'});
      const store = Object.assign(new Store(), {Sales: [] as Entity[]});
      sales.push(sale); stores.push(store);
      const Service = m.ProcessSaleService_AutoGenerated as Ctor, service = new Service();
      if (key !== 'no-sale') service.CurrentSale = sale;
      if (key !== 'no-store') service.CurrentStore = store;
      const amount = key === 'insufficient' ? 5 : key === 'exact' ? 6.5 : 10;
      const admitted = [key !== 'no-sale', !sale.IsComplete, Boolean(sale.IsReadytoPay), amount >= Number(sale.Amount), key !== 'no-store'];
      const payment = () => payments[0], start = Date.now();
      const state = (): FiniteObservation[] => [
        check('Q01', payments.length, 1), check('Q02', payment()?.AmountTendered, amount),
        check('Q03', payment()?.BelongedSale === sale, true), check('Q04', sale.AssoicatedPayment === payment(), true),
        check('Q05', sale.Belongedstore === store, true), check('Q06', (store.Sales as Entity[]).includes(sale), true),
        check('Q07', sale.IsComplete, true),
        {obligationId: 'Q08', passed: Boolean(sale.Time &&
          Number((sale.Time as {valueOf: () => number}).valueOf()) >= start - 1000 &&
          Number((sale.Time as {valueOf: () => number}).valueOf()) <= Date.now() + 1000),
          expected: 'timestamp within invocation interval', observed: sale.Time ?? null},
        check('Q09', payment()?.Balance, amount - Number(sale.Amount)),
      ];
      return {invoke: () => (service.makeCashPayment as (amount: number) => unknown)(amount),
        observePrecondition: id => ({satisfied: admitted[Number(id.slice(1)) - 1],
          expected: cashObligations[Number(id.slice(1)) - 1].requirement, observed: admitted[Number(id.slice(1)) - 1]}),
        observeAfterPostcheckFailure: state,
        observe: result => [...cashObligations.slice(0, 5).map((item, index) => check(item.id, admitted[index], true)),
          ...state(), check('Q10', result, true)]};
    });
  },
};
