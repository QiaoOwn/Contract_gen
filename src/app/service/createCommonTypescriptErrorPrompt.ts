export const createCommonTypescriptErrorPrompt = () => {
  return [
    `\`\`\`Please notice !!! \`\`\``,
    `if you meet error like this: \`\`\`Property value of ObjectProperty expected node to be of a type ["Expression","PatternLike"] but instead got undefined\`\`\`, that means you use the \`\`\`let obj in className.oclIsNew()\`\`\` in the position is not the first expression in postcondition`,
  ].join('\n');
};
