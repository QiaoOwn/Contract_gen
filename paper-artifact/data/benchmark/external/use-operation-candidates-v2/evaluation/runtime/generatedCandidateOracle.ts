export type ExternalCandidateRuntime = Record<string, any>;

export type ExternalHiddenScenario = Readonly<{
  id: string;
  kind: 'positive' | 'negative_precondition';
  run: (runtime: ExternalCandidateRuntime, serviceName: string) => void;
}>;

const fail = (message: string): never => {
  throw new Error(message);
};

const assert = (condition: unknown, message: string): void => {
  if (!condition) fail(message);
};

const assertEqual = (actual: unknown, expected: unknown, message: string): void => {
  if (!Object.is(actual, expected)) {
    fail(`${message}; expected=${String(expected)}, actual=${String(actual)}`);
  }
};

const expectPrecondition = (action: () => unknown, message: string): void => {
  try {
    action();
  } catch (error) {
    if (error instanceof Error && error.name === 'PreconditionError') return;
    throw error;
  }
  fail(message);
};

export const resetExternalCandidateRuntime = (runtime: ExternalCandidateRuntime): void => {
  for (const name of [
    'Person',
    'Company',
    'Node',
    'Worker',
    'Project',
    'Qualification',
    'Training',
    'Point',
    'Truck',
  ]) {
    const clazz = runtime[name];
    if (!clazz) continue;
    const repository = runtime.getRepository(clazz);
    if (Array.isArray(repository)) repository.splice(0, repository.length);
  }
};

const register = <T>(runtime: ExternalCandidateRuntime, clazz: any, value: T): T => {
  runtime.getRepository(clazz).push(value);
  return value;
};

const context = (runtime: ExternalCandidateRuntime, serviceName: string, contextType: string) => {
  const value = new runtime[serviceName]();
  register(runtime, runtime[contextType], value);
  return value;
};

const employeePerson = (runtime: ExternalCandidateRuntime, name = 'Alice') => {
  const value = new runtime.Person();
  value.name = name;
  value.age = 30;
  value.salary = 100;
  return register(runtime, runtime.Person, value);
};

const employeeCompany = (runtime: ExternalCandidateRuntime, serviceName: string) => {
  const value = context(runtime, serviceName, 'Company');
  value.name = 'Acme';
  value.location = 'Berlin';
  value.employee = [];
  return value;
};

const civilPerson = (
  runtime: ExternalCandidateRuntime,
  name: string,
  gender: 'female' | 'male',
  civstat: 'single' | 'married' | 'divorced' | 'widowed' = 'single',
  alive = true
) => {
  const value = new runtime.Person();
  value.name = name;
  value.gender = runtime.Gender[gender];
  value.civstat = runtime.CivilStatus[civstat];
  value.alive = alive;
  return register(runtime, runtime.Person, value);
};

const projectWorker = (
  runtime: ExternalCandidateRuntime,
  nickname: string,
  qualifications: any[] = []
) => {
  const value = new runtime.Worker();
  value.nickname = nickname;
  value.salary = 100;
  value.projects = [];
  value.qualifications = [...qualifications];
  return register(runtime, runtime.Worker, value);
};

const qualification = (runtime: ExternalCandidateRuntime, description: string) => {
  const value = new runtime.Qualification();
  value.description = description;
  value.workers = [];
  value.projects = [];
  return register(runtime, runtime.Qualification, value);
};

const projectCompany = (runtime: ExternalCandidateRuntime, serviceName: string) => {
  const value = context(runtime, serviceName, 'Company');
  value.name = 'Studio';
  value.employees = [];
  value.projects = [];
  return value;
};

const project = (
  runtime: ExternalCandidateRuntime,
  company: any,
  name: string,
  status: 'planned' | 'active' | 'finished' | 'suspended' = 'planned',
  requirements: any[] = []
) => {
  const value = new runtime.Project();
  value.name = name;
  value.size = runtime.ProjectSize.small;
  value.status = runtime.ProjectStatus[status];
  value.company = company;
  value.members = [];
  value.requirements = [...requirements];
  value.predecessors = [];
  value.successors = [];
  company.projects.push(value);
  return register(runtime, runtime.Project, value);
};

const tollPoint = (runtime: ExternalCandidateRuntime, name?: string) => {
  const value = new runtime.Point();
  value.name = name;
  value.north = [];
  value.south = [];
  return register(runtime, runtime.Point, value);
};

const tollTruck = (runtime: ExternalCandidateRuntime, num?: string) => {
  const value = new runtime.Truck();
  value.num = num;
  return register(runtime, runtime.Truck, value);
};

const scenarios: Record<string, readonly ExternalHiddenScenario[]> = {
  'use-employee-person-raise-salary': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const person = context(runtime, serviceName, 'Person');
        person.salary = 100;
        const result = person.raiseSalary(0.25);
        assertEqual(person.salary, 125, 'salary must be updated from the pre-state');
        assertEqual(result, 125, 'result must equal the updated salary');
      },
    },
  ],
  'use-employee-company-hire': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const company = employeeCompany(runtime, serviceName);
        const person = employeePerson(runtime);
        company.hire(person);
        assert(company.employee.includes(person), 'the hired person must be in employee');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const company = employeeCompany(runtime, serviceName);
        expectPrecondition(() => company.hire(undefined), 'undefined person must be rejected');
      },
    },
    {
      id: 'reject_precondition_2',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const company = employeeCompany(runtime, serviceName);
        const person = employeePerson(runtime);
        company.employee.push(person);
        expectPrecondition(() => company.hire(person), 'duplicate employee must be rejected');
      },
    },
  ],
  'use-employee-company-fire': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const company = employeeCompany(runtime, serviceName);
        const person = employeePerson(runtime);
        company.employee.push(person);
        company.fire(person);
        assert(
          !company.employee.includes(person),
          'the fired person must be removed from employee'
        );
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const company = employeeCompany(runtime, serviceName);
        const person = employeePerson(runtime);
        expectPrecondition(() => company.fire(person), 'nonemployee must be rejected');
      },
    },
  ],
  'use-graph-node-new-target': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const node = context(runtime, serviceName, 'Node');
        node.source = [];
        node.target = [];
        const before = [...runtime.getRepository(runtime.Node)];
        node.newTarget();
        const after = runtime.getRepository(runtime.Node);
        const created = after.filter((candidate: any) => !before.includes(candidate));
        assertEqual(created.length, 1, 'exactly one fresh node must be created');
        assert(node.target.includes(created[0]), 'the fresh node must be linked as target');
      },
    },
  ],
  'use-civstat-person-birth': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const person = context(runtime, serviceName, 'Person');
        person.birth('Ada', runtime.Gender.female);
        assertEqual(person.name, 'Ada', 'name must be initialized');
        assertEqual(person.gender, runtime.Gender.female, 'gender must be initialized');
        assertEqual(person.civstat, runtime.CivilStatus.single, 'civil status must be single');
        assertEqual(person.alive, true, 'person must be alive');
      },
    },
    ...['name', 'civstat', 'gender', 'alive', 'wife', 'husband'].map((field, index) => ({
      id: `reject_precondition_${index + 1}`,
      kind: 'negative_precondition' as const,
      run: (runtime: ExternalCandidateRuntime, serviceName: string) => {
        const person = context(runtime, serviceName, 'Person');
        person[field] =
          field === 'alive'
            ? false
            : field === 'wife' || field === 'husband'
              ? new runtime.Person()
              : 'used';
        expectPrecondition(
          () => person.birth('Ada', runtime.Gender.female),
          `${field} must be undefined`
        );
      },
    })),
  ],
  'use-civstat-person-marry': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const person = context(runtime, serviceName, 'Person');
        person.name = 'Ada';
        person.gender = runtime.Gender.female;
        person.civstat = runtime.CivilStatus.single;
        person.alive = true;
        const spouse = civilPerson(runtime, 'Alan', 'male');
        person.marry(spouse);
        assertEqual(person.civstat, runtime.CivilStatus.married, 'current person must be married');
        assertEqual(spouse.civstat, runtime.CivilStatus.married, 'spouse must be married');
        assertEqual(person.husband, spouse, 'female person must link the spouse as husband');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const person = context(runtime, serviceName, 'Person');
        person.alive = true;
        person.civstat = runtime.CivilStatus.single;
        person.gender = runtime.Gender.female;
        expectPrecondition(() => person.marry(undefined), 'undefined spouse must be rejected');
      },
    },
    ...[
      ['self_dead', false, true, 'single', 'single', 'female', 'male'],
      ['spouse_dead', true, false, 'single', 'single', 'female', 'male'],
      ['self_married', true, true, 'married', 'single', 'female', 'male'],
      ['spouse_married', true, true, 'single', 'married', 'female', 'male'],
      ['same_gender', true, true, 'single', 'single', 'female', 'female'],
    ].map((values, index) => ({
      id: `reject_precondition_${index + 2}`,
      kind: 'negative_precondition' as const,
      run: (runtime: ExternalCandidateRuntime, serviceName: string) => {
        const [, selfAlive, spouseAlive, selfStatus, spouseStatus, selfGender, spouseGender] =
          values as any[];
        const person = context(runtime, serviceName, 'Person');
        person.alive = selfAlive;
        person.civstat = runtime.CivilStatus[selfStatus];
        person.gender = runtime.Gender[selfGender];
        const spouse = civilPerson(runtime, 'B', spouseGender, spouseStatus, spouseAlive);
        expectPrecondition(() => person.marry(spouse), `${values[0]} must be rejected`);
      },
    })),
  ],
  'use-civstat-person-divorce': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const person = context(runtime, serviceName, 'Person');
        person.gender = runtime.Gender.female;
        person.civstat = runtime.CivilStatus.married;
        person.alive = true;
        const spouse = civilPerson(runtime, 'Alan', 'male', 'married');
        person.husband = spouse;
        spouse.wife = person;
        person.divorce();
        assertEqual(
          person.civstat,
          runtime.CivilStatus.divorced,
          'current person must be divorced'
        );
        assertEqual(spouse.civstat, runtime.CivilStatus.divorced, 'former spouse must be divorced');
        assert(person.husband == null, 'marriage link must be removed');
      },
    },
    ...[
      ['not_married', 'single', true, true, 'female'],
      ['self_dead', 'married', false, true, 'female'],
      ['husband_dead', 'married', true, false, 'female'],
      ['wife_dead', 'married', true, false, 'male'],
    ].map((values, index) => ({
      id: `reject_precondition_${index + 1}`,
      kind: 'negative_precondition' as const,
      run: (runtime: ExternalCandidateRuntime, serviceName: string) => {
        const [, status, selfAlive, spouseAlive, selfGender] = values as any[];
        const person = context(runtime, serviceName, 'Person');
        person.gender = runtime.Gender[selfGender];
        person.civstat = runtime.CivilStatus[status];
        person.alive = selfAlive;
        const spouseGender = selfGender === 'female' ? 'male' : 'female';
        const spouse = civilPerson(runtime, 'B', spouseGender, 'married', spouseAlive);
        person[selfGender === 'female' ? 'husband' : 'wife'] = spouse;
        expectPrecondition(() => person.divorce(), `${values[0]} must be rejected`);
      },
    })),
  ],
  'use-civstat-person-death': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const person = context(runtime, serviceName, 'Person');
        person.gender = runtime.Gender.female;
        person.civstat = runtime.CivilStatus.married;
        person.alive = true;
        const spouse = civilPerson(runtime, 'B', 'male', 'married');
        person.husband = spouse;
        spouse.wife = person;
        person.death();
        assertEqual(person.alive, false, 'current person must be dead');
        assertEqual(spouse.civstat, runtime.CivilStatus.widowed, 'former spouse must be widowed');
        assert(person.husband == null, 'marriage link must be removed');
      },
    },
    {
      id: 'supplemental_single_branch',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const person = context(runtime, serviceName, 'Person');
        person.gender = runtime.Gender.female;
        person.civstat = runtime.CivilStatus.single;
        person.alive = true;
        person.death();
        assertEqual(person.alive, false, 'single person must be dead');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const person = context(runtime, serviceName, 'Person');
        person.alive = false;
        expectPrecondition(() => person.death(), 'dead person must be rejected');
      },
    },
  ],
  'use-projectworld-company-hire': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const company = projectCompany(runtime, serviceName);
        const worker = projectWorker(runtime, 'ada');
        company.hire(worker);
        assert(company.employees.includes(worker), 'worker must be employed');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const company = projectCompany(runtime, serviceName);
        const worker = projectWorker(runtime, 'ada');
        company.employees.push(worker);
        expectPrecondition(() => company.hire(worker), 'existing employee must be rejected');
      },
    },
  ],
  'use-projectworld-company-fire': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const company = projectCompany(runtime, serviceName);
        const skill = qualification(runtime, 'design');
        const worker = projectWorker(runtime, 'ada', [skill]);
        company.employees.push(worker);
        worker.employer = company;
        const value = project(runtime, company, 'main', 'active', [skill]);
        value.members.push(worker);
        worker.projects.push(value);
        company.fire(worker);
        assert(!company.employees.includes(worker), 'worker must be removed from employees');
        assert(!value.members.includes(worker), 'worker must be removed from prior project');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const company = projectCompany(runtime, serviceName);
        const worker = projectWorker(runtime, 'ada');
        expectPrecondition(() => company.fire(worker), 'nonemployee must be rejected');
      },
    },
  ],
  'use-projectworld-company-start': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const company = projectCompany(runtime, serviceName);
        const skill = qualification(runtime, 'formal');
        const worker = projectWorker(runtime, 'ada', [skill]);
        const predecessor = project(runtime, company, 'pre', 'finished');
        const value = project(runtime, company, 'main', 'planned', [skill]);
        value.predecessors.push(predecessor);
        value.members.push(worker);
        company.start(value);
        assertEqual(value.status, runtime.ProjectStatus.active, 'project must become active');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const company = projectCompany(runtime, serviceName);
        const value = project(runtime, company, 'main');
        value.predecessors.push(project(runtime, company, 'pre', 'active'));
        expectPrecondition(() => company.start(value), 'unfinished predecessor must be rejected');
      },
    },
    {
      id: 'reject_precondition_2',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const company = projectCompany(runtime, serviceName);
        const value = project(runtime, company, 'main', 'finished');
        expectPrecondition(() => company.start(value), 'finished project must be rejected');
      },
    },
    {
      id: 'reject_precondition_3',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const company = projectCompany(runtime, serviceName);
        const skill = qualification(runtime, 'formal');
        const value = project(runtime, company, 'main', 'planned', [skill]);
        expectPrecondition(() => company.start(value), 'underqualified project must be rejected');
      },
    },
  ],
  'use-projectworld-company-finish': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const company = projectCompany(runtime, serviceName);
        const worker = projectWorker(runtime, 'ada');
        const value = project(runtime, company, 'main', 'active');
        value.members.push(worker);
        company.finish(value);
        assertEqual(value.status, runtime.ProjectStatus.finished, 'project must be finished');
        assertEqual(value.members.length, 0, 'members must be cleared');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const company = projectCompany(runtime, serviceName);
        const value = project(runtime, company, 'main', 'planned');
        expectPrecondition(() => company.finish(value), 'inactive project must be rejected');
      },
    },
  ],
  'use-tollcollect-point-init': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const point = context(runtime, serviceName, 'Point');
        point.north = [];
        point.south = [];
        point.init('P1');
        assertEqual(point.name, 'P1', 'point name must be initialized');
      },
    },
    ...['name', 'north', 'south'].map((field, index) => ({
      id: `reject_precondition_${index + 1}`,
      kind: 'negative_precondition' as const,
      run: (runtime: ExternalCandidateRuntime, serviceName: string) => {
        const point = context(runtime, serviceName, 'Point');
        point.north = [];
        point.south = [];
        point[field] = field === 'name' ? 'used' : [tollPoint(runtime, 'other')];
        expectPrecondition(() => point.init('P1'), `${field} initialization guard must reject`);
      },
    })),
  ],
  'use-tollcollect-point-north-connect': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const point = context(runtime, serviceName, 'Point');
        point.name = 'south';
        point.north = [];
        point.south = [];
        const north = tollPoint(runtime, 'north');
        point.northConnect(north);
        assert(point.north.includes(north), 'north neighbor must be added');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const point = context(runtime, serviceName, 'Point');
        point.north = [];
        point.south = [];
        expectPrecondition(() => point.northConnect(undefined), 'undefined point must be rejected');
      },
    },
    {
      id: 'reject_precondition_2',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const point = context(runtime, serviceName, 'Point');
        point.north = [];
        point.south = [];
        const north = tollPoint(runtime, 'north');
        point.north.push(north);
        expectPrecondition(() => point.northConnect(north), 'existing connection must be rejected');
      },
    },
    {
      id: 'reject_precondition_3',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const point = context(runtime, serviceName, 'Point');
        point.north = [];
        point.south = [];
        expectPrecondition(() => point.northConnect(point), 'self connection must be rejected');
      },
    },
    {
      id: 'reject_precondition_4',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const point = context(runtime, serviceName, 'Point');
        point.north = [];
        point.south = [];
        const north = tollPoint(runtime, 'north');
        north.north.push(point);
        expectPrecondition(
          () => point.northConnect(north),
          'cycle-forming north edge must be rejected'
        );
      },
    },
  ],
  'use-tollcollect-point-south-connect': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const point = context(runtime, serviceName, 'Point');
        point.name = 'north';
        point.north = [];
        point.south = [];
        const south = tollPoint(runtime, 'south');
        point.southConnect(south);
        assert(point.south.includes(south), 'south neighbor must be added');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const point = context(runtime, serviceName, 'Point');
        point.north = [];
        point.south = [];
        expectPrecondition(() => point.southConnect(undefined), 'undefined point must be rejected');
      },
    },
    {
      id: 'reject_precondition_2',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const point = context(runtime, serviceName, 'Point');
        point.north = [];
        point.south = [];
        const south = tollPoint(runtime, 'south');
        point.south.push(south);
        expectPrecondition(() => point.southConnect(south), 'existing connection must be rejected');
      },
    },
    {
      id: 'reject_precondition_3',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const point = context(runtime, serviceName, 'Point');
        point.north = [];
        point.south = [];
        expectPrecondition(() => point.southConnect(point), 'self connection must be rejected');
      },
    },
    {
      id: 'reject_precondition_4',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const point = context(runtime, serviceName, 'Point');
        point.north = [];
        point.south = [];
        const south = tollPoint(runtime, 'south');
        south.south.push(point);
        expectPrecondition(
          () => point.southConnect(south),
          'cycle-forming south edge must be rejected'
        );
      },
    },
  ],
  'use-tollcollect-truck-init': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        truck.init('T1');
        assertEqual(truck.num, 'T1', 'truck number must be initialized');
        assertEqual(truck.trips.length, 0, 'trip history must be empty');
        assertEqual(truck.debt, 0, 'debt must be zero');
      },
    },
    ...['num', 'trips', 'debt'].map((field, index) => ({
      id: `reject_precondition_${index + 1}`,
      kind: 'negative_precondition' as const,
      run: (runtime: ExternalCandidateRuntime, serviceName: string) => {
        const truck = context(runtime, serviceName, 'Truck');
        truck[field] = field === 'num' ? 'used' : field === 'trips' ? [] : 0;
        expectPrecondition(() => truck.init('T1'), `${field} must be undefined`);
      },
    })),
  ],
  'use-tollcollect-truck-enter': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        truck.num = 'T1';
        truck.trips = [];
        truck.debt = 0;
        const entry = tollPoint(runtime, 'entry');
        truck.enter(entry);
        assertEqual(truck.point, entry, 'entry point must become current');
        assertEqual(truck.debt, 1, 'debt must become one');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        const entry = tollPoint(runtime, 'entry');
        truck.trips = [entry];
        expectPrecondition(() => truck.enter(entry), 'open trip must be rejected');
      },
    },
    {
      id: 'reject_precondition_2',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        const entry = tollPoint(runtime, 'entry');
        truck.trips = [];
        truck.point = entry;
        expectPrecondition(() => truck.enter(entry), 'located truck must be rejected');
      },
    },
  ],
  'use-tollcollect-truck-move': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        const first = tollPoint(runtime, 'first');
        const target = tollPoint(runtime, 'target');
        first.north.push(target);
        target.south.push(first);
        truck.point = first;
        truck.trips = [];
        truck.debt = 1;
        truck.move(target);
        assertEqual(truck.point, target, 'target must become current');
        assertEqual(truck.trips.at(-1), first, 'old point must be appended');
        assertEqual(truck.debt, 2, 'debt must increase by one');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        truck.trips = [];
        const target = tollPoint(runtime, 'target');
        expectPrecondition(
          () => truck.move(target),
          'truck without current point must be rejected'
        );
      },
    },
    {
      id: 'reject_precondition_2',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        truck.point = tollPoint(runtime, 'first');
        truck.point.north = [];
        truck.point.south = [];
        const target = tollPoint(runtime, 'target');
        expectPrecondition(() => truck.move(target), 'disconnected target must be rejected');
      },
    },
  ],
  'use-tollcollect-truck-pay': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        truck.point = tollPoint(runtime, 'point');
        truck.debt = 3;
        truck.pay(2);
        assertEqual(truck.debt, 1, 'payment must be subtracted from pre-state debt');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        truck.point = tollPoint(runtime, 'point');
        truck.debt = 3;
        expectPrecondition(() => truck.pay(0), 'nonpositive payment must be rejected');
      },
    },
    {
      id: 'reject_precondition_2',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        truck.debt = 3;
        expectPrecondition(() => truck.pay(1), 'truck without current point must be rejected');
      },
    },
  ],
  'use-tollcollect-truck-bye': [
    {
      id: 'reference_behavior',
      kind: 'positive',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        const point = tollPoint(runtime, 'exit');
        truck.point = point;
        truck.trips = [];
        truck.debt = -2;
        const result = truck.bye();
        assertEqual(result, 2, 'result must be absolute debt');
        assertEqual(truck.trips.at(-2), point, 'old point must be appended');
        assertEqual(truck.trips.at(-1), undefined, 'undefined end marker must be appended');
        assert(truck.point == null, 'current point must be cleared');
      },
    },
    {
      id: 'reject_precondition_1',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        truck.trips = [];
        truck.debt = 0;
        expectPrecondition(() => truck.bye(), 'truck without current point must be rejected');
      },
    },
    {
      id: 'reject_precondition_2',
      kind: 'negative_precondition',
      run: (runtime, serviceName) => {
        const truck = context(runtime, serviceName, 'Truck');
        truck.point = tollPoint(runtime, 'exit');
        truck.trips = [];
        truck.debt = 1;
        expectPrecondition(() => truck.bye(), 'positive debt must be rejected');
      },
    },
  ],
};

export const getExternalHiddenScenarios = (
  operationId: string
): readonly ExternalHiddenScenario[] => {
  const result = scenarios[operationId];
  if (!result) throw new Error(`No hidden scenario adapter for ${operationId}`);
  return result;
};

export const externalHiddenOracleCoverage = () =>
  Object.entries(scenarios).map(([operation_id, mapped]) => ({
    operation_id,
    scenarios: mapped.length,
    positive: mapped.filter((item) => item.kind === 'positive').length,
    negative_precondition: mapped.filter((item) => item.kind === 'negative_precondition').length,
  }));
