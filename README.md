http://codinggorilla.domemtech.com/antlr/xtext/2021/09/10/converting-xtext.html

Install Dotnet 8.0.x

dotnet tool install -g trcaret
dotnet tool install -g trclonereplace
dotnet tool install -g trcombine
dotnet tool install -g trconvert
dotnet tool install -g trcover
dotnet tool install -g trfoldlit
dotnet tool install -g trgen
dotnet tool install -g trgenvsc
dotnet tool install -g trglob
dotnet tool install -g triconv
dotnet tool install -g tritext
dotnet tool install -g trjson
dotnet tool install -g trparse
dotnet tool install -g trperf
dotnet tool install -g trquery
dotnet tool install -g trrename
dotnet tool install -g trsort
dotnet tool install -g trsplit
dotnet tool install -g trsponge
dotnet tool install -g trtext
dotnet tool install -g trtokens
dotnet tool install -g trtree
dotnet tool install -g trunfold
dotnet tool install -g trwdog
dotnet tool install -g trxml
dotnet tool install -g trxml2

trparse REMODEL.g -t ANTLRv3 | trconvert | trsponge

删掉
RULE_WS: (' ' | '\t' | '\r' | '\n')+;
增加
WS: [ \t\r\n]+ -> skip;
WS: [ \t\r\n]+ -> skip;

LINE*COMMENT: '//' ~[\r\n]* -> channel(1);
BLOCK*COMMENT: '/*' ._? '_/' -> channel(1);

antlr4 -Dlanguage=TypeScript ./antlr4/REMODEL.g4 -visitor

R1: getRepository(Class)
R2: R2.filter
R3: R1.find
R4:
R5:
R6:
R7:
// ref: StandardOPs.ts
R8: StandardOPs.oclIsUndefined
// ref: StandardOPs.ts
R9: StandardOPs.oclIsTypeOf
// ref: StandardOPs.ts
R10: StandardOPs.oclIsTypeOf
R11:
R12:
R13: R2.includes
R14:
R15:
R16:
R17:
R18:
R19:
R20:
R21:
R22:
R23:
R24:
R25:
R26:

type RuleContext 生成代码需要context

exists: some

todo: service中嵌套service
CoCoME/processSale/makeCardPayment
