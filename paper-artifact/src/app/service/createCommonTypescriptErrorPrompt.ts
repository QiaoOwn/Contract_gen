export const createCommonTypescriptErrorPrompt = () =>
  [
    'TypeScript lowering reminder:',
    '- When creating an object, place let object:Type in object.oclIsNew() at the start of the postcondition expression.',
    '- Use only model elements and executable constructs declared in the supplied grammar and context.',
  ].join('\n');
