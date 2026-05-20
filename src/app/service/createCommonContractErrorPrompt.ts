export const createCommonContractErrorPrompt = () => {
  return [
    `\`\`\`Please notice !!! \`\`\``,
    `You are always generate the wrong code like \`\`\`result = a = b\`\`\` in postcondition, you should be careful about this, the right formula is \`\`\`a = b and result = a\`\`\``,
    `You are always generate the wrong code like \`\`\`result = (a = b)\`\`\` in postcondition, you should be careful about this, a=b should be declare in definition part like \`\`\`bool:Boolean = if a = b then true else false endif\`\`\``,
    `You are always generate the wrong code like \`\`\`c = (a = b)\`\`\` in postcondition, you should be careful about this, \`\`\`a = b\`\`\` should be declare in definition part like \`\`\`c:Boolean = if a = b then true else false endif\`\`\``,
    `You are always generate the wrong code like \`\`\`(expressionA) and (expressionB)\`\`\`, you should be careful about this, you should just generate the code \`\`\`expressionA and expressionB\`\`\`, don't abuse the usage of \`\`\`(\`\`\` or \`\`\`)\`\`\``,
    `You are always generate the wrong code like \`\`\`expressionA \\n expressionB\`\`\` in definition part, it should be \`\`\`expressionA, expressionB\`\`\``,
    `You are always generate the wrong code with the keyword \`\`\`not\`\`\`, there is no \`\`\`not\`\`\` keyword in g4 file`,
    `Collection ops includes(), excludes(), includesAll(), excludesAll() ONLY allow a single variable name inside parentheses (example: Staff.allInstance()->includes(staff)). Do NOT pass a nested expression such as Device.allInstance()->any(...) inside excludes(...). Instead bind in definition (example: dup:Device = Device.allInstance()->any(d:Device|d.Id=id)) then write dup.oclIsUndefined() = true in precondition, or use exists/any iterators allowed by the grammar.`,
    `You are always generate the wrong code to use the logic \`\`\`if\`\`\` to validate the condition in postcondition, the validation part should be in precondition`,
  ].join('\n');
};
