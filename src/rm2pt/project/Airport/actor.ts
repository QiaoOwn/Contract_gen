import {Actor} from '../../model/Actor';

export const GroundStaff = new Actor({
  name: 'GroundStaff',
  description: 'Responsible for inquiring requests, scoring, and raising repair requests.',
});

export const Manager = new Actor({
  name: 'Manager',
  description: 'Has the authority to approve or reject repair requests.',
});

export const Master = new Actor({
  name: 'Master',
  description: 'Assigns tasks and can raise repair requests.',
});

export const Worker = new Actor({
  name: 'Worker',
  description: 'Handles repair tasks, seeks help, and submits repair results.',
});

export const Admin = new Actor({
  name: 'Admin',
  description: 'Manages users and devices within the system.',
});
