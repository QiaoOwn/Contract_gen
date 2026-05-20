import {Actor} from '../../model/Actor';

export const User = new Actor({
  name: 'User',
  description: 'The user',
});

export const Faculty = new Actor({
  name: 'Faculty',
  description: 'The faculty user',
});

export const Student = new Actor({
  name: 'Student',
  description: 'The student user',
});

export const Administrator = new Actor({
  name: 'Administrator',
  description: 'The administrator',
});

export const Librarian = new Actor({
  name: 'Librarian',
  description: 'The librarian',
});

export const Scheduler = new Actor({
  name: 'Scheduler',
  description: 'The scheduler',
});

export const ThirdPartSystem = new Actor({
  name: 'ThirdPartSystem',
  description: 'The third part system',
});
