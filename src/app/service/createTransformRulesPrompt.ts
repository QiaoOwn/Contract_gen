export const createTransformRulesPrompt = () => {
  return [
    `Here are transform rules`,
    `Rule1:`,
    `grammar: \`\`\`ClassName::Enumvalue\`\`\``,
    `description: \`\`\`retrive the enum value from the class which name is ClassName\`\`\``,

    `Rule2:`,
    `grammar: \`\`\`self.GlobalVariableName\`\`\``,
    `description: \`\`\`use the global variable in the Service or Module\`\`\``,

    `For \`definition\`, there 7 rules you need to know`,

    `Rule1:`,
    `grammar: \`\`\`obs:Set(ClassName) = ClassName.allInstance()\`\`\``,
    `description: \`\`\`find all instances of that ClassName and named the variable to obs\`\`\``,

    `Rule2:`,
    `grammar: \`\`\`obs:Set(ClassName) = ClassName.allInstance()->select(o | conditions(o))\`\`\``,
    `description: \`\`\`find all instances meet the conditions of that ClassName and named the variable to obs\`\`\``,

    `Rule3:`,
    `grammar: \`\`\`obs:ClassName = ClassName.allInstance()->any(o | conditions(o))\`\`\``,
    `description: \`\`\`find the first instance meet the conditions of that ClassName and named the variable to obs\`\`\``,

    `Rule4:`,
    `grammar: \`\`\`o:ClassName = ob.assoName\`\`\``,
    `description: \`\`\`find the linked object through assoName, where the multiplicity of the association may be one-to-one relationship and this will return an instance of ClassName reference named o to the object linked with object ob\`\`\``,

    `Rule5:`,
    `grammar: \`\`\`obs:Set(ClassName) = ob.assoName\`\`\``,
    `description: \`\`\`find the linked objects through assoName, where the multiplicity of the association may be one-to-many relationship and this will return instances of ClassName reference named obs to the object linked with object ob\`\`\``,

    `Rule6:`,
    `grammar: \`\`\`obs:Set(ClassName) = ob.assoName->select(o | conditions(o))\`\`\``,
    `description: \`\`\`find the linked objects through assoName and the conditions, where the multiplicity of the association may be one-to-many relationship and this will return instances of ClassName reference named obs to the object linked with object ob\`\`\``,

    `Rule7:`,
    `grammar: \`\`\`o:ClassName = ob.assoName\`\`\``,
    `description: \`\`\`find the linked object through assoName and the conditions, where the multiplicity of the association may be one-to-one relationship and this will return an instance of ClassName reference named o to the object linked with object ob\`\`\``,

    `For \`precondition\`, there 8 rules you need to know`,

    `Rule1:`,
    `grammar: \`\`\`ob.oclIsUndefined() = bool\`\`\``,
    `description: \`\`\`check that the reference ob does not refer to an object\`\`\``,

    `Rule2:`,
    `grammar: \`\`\`var.oclIsTypeOf(type)\`\`\``,
    `description: \`\`\`check that the variable var conforms the specific type, in which the var is a variable of primitive type, an object reference, or a reference list\`\`\``,

    `Rule3:`,
    `grammar: \`\`\`obs.isEmpty() = bool\`\`\``,
    `description: \`\`\`check the object list obs is empty\`\`\``,

    `Rule4:`,
    `grammar: \`\`\`obs.size() op mathExp\`\`\``,
    `description: \`\`\`op is the operator = or <> (euqal or not equal) or other infix comparison operator, the mathExp may contain numbers, variables, operators, functions, and brackets\`\`\``,

    `Rule5:`,
    `grammar: \`\`\`ob.AttriName op varPM\`\`\``,
    `description: \`\`\`op is the operator = or <> (euqal or not equal) or other infix comparison operators, and the AttriName is the attribute of the object ob, and the varPM is a variable of primitive type or a math expression\`\`\``,

    `Rule6:`,
    `grammar: \`\`\`ClassName.allInstance()->includes(ob)\`\`\``,
    `description: \`\`\`In the precondition section, this rule will check if the object ob is in the ClassName\`\`\``,

    `Rule7:`,
    `grammar: \`\`\`ClassName.allInstance()->excludes(ob)\`\`\``,
    `description: \`\`\`In the precondition section, this rule will check if the object ob isn't in the ClassName\`\`\``,

    `Rule8:`,
    `grammar: \`\`\`ClassName.allInstance()->isUnique(o:ClassName | o.AttriName)\`\`\``,
    `description: \`\`\`check the specific attribute AttriName has the unique value or not\`\`\``,

    `For \`postcondition\`, there 11 rules you need to know`,

    `Rule1:`,
    `grammar: \`\`\`let ob:ClassName in ob.oclIsNew()\`\`\``,
    `description: \`\`\`create a new empty object ob of the ClassName. The ob.oclIsNew() specifies that the object ob was created after the execution of system operation, this expression is always used as the first expression in postcondition, if needed to declare a new instance\`\`\``,

    `Rule2:`,
    `grammar: \`\`\`In the post condition, ClassName.allInstance()->includes(ob)\`\`\``,
    `description: \`\`\`Add the ob in the ClassName\`\`\``,

    `Rule3:`,
    `grammar: \`\`\`In the post condition, ClassName.allInstance()->excludes(ob)\`\`\``,
    `description: \`\`\`Delete the ob from the ClassName\`\`\``,

    `Rule4:`,
    `grammar: \`\`\`ob.assoName->includes(addOb)\`\`\``,
    `description: \`\`\`Add the addOb to the ClassName which ob.assoName belongs to\`\`\``,

    `Rule5:`,
    `grammar: \`\`\`ob.assoName->excludes(removeOb)\`\`\``,
    `description: \`\`\`Remove the removeOb from the ClassName which ob.assoName belongs to\`\`\``,

    `Rule6:`,
    `grammar: \`\`\`ob.assoName = addOb\`\`\``,
    `description: \`\`\`link the addOb to the ob.assoName\`\`\``,

    `Rule7:`,
    `grammar: \`\`\`ob.assoName = null\`\`\``,
    `description: \`\`\`remove the link from the ob.assoName\`\`\``,

    `Rule8:`,
    `grammar: \`\`\`ob.attriName = mathExp\`\`\``,
    `description: \`\`\`Set the attriName of the object ob of the value equals to the mathExp\`\`\``,

    `Rule9:`,
    `grammar: \`\`\`obs−>forAll(o:ClassName|o.AttriName=mathExp)\`\`\``,
    `description: \`\`\`Extension for Rule9. Specify the single object to objects\`\`\``,

    `Rule10:`,
    `grammar: \`\`\`result = var\`\`\``,
    `description: \`\`\`The variable named return equal to the variable var, this is the last statement in the post condition\`\`\``,

    `Rule11:`,
    `grammar: \`\`\`ThirdPartyServices.opName(vars)\`\`\``,
    `description: \`\`\`a special transformation rule that specifies the third-party application programming interface (APIs) such as cardPayment() and sorting() used in the postcondition\`\`\``,
  ].join('\n');
};
