// @ts-nocheck
import generate from '@babel/generator';
import * as t from '@babel/types';
const identifierX = t.identifier('x');
identifierX.typeAnnotation = t.tsTypeAnnotation(t.tsNumberKeyword());
const astNode = t.variableDeclaration('const', [
  t.variableDeclarator(identifierX, t.numericLiteral(5)),
]);
const code = generate(astNode).code;
// 生成：const x:number = 5;

`
// 银行卡状态枚举类
enum CardStatus {
  NORMAL = 'NORMAL',
  SUSPEND = 'SUSPEND',
  CANCEL = 'CANCEL',
}

// 用户实体
class User extends BaseEntity{
    UserID:number
    Name:string
    Address:string

    OwnCard: BankCard[]
}
 
// 实体模版
class %实体名称（Entity.Name）% extends? %实体继承的实体名称（Entity.Extends.Name）%{
    %属性名称1（Entity.Attributes[1].Name）: 属性类型（Entity.Attributes[1].Type）%
    %属性名称2（Entity.Attributes[2].Name）: 属性类型（Entity.Attributes[2].Type）%
    %属性名称3（Entity.Attributes[3].Name）: 属性类型（Entity.Attributes[3].Type）%
    ...
    %属性名称i（Entity.Attributes[i].Name）: 属性类型（Entity.Attributes[i].Name）%

    %关联属性名称1（Entity.Relationships[1].Name）: 关联属性类型（Entity.Relationships[1].RelatedEntity）%
    %关联属性名称2（Entity.Relationships[2].Name）: 关联属性类型（Entity.Relationships[2].RelatedEntity）%
    %关联属性名称3（Entity.Relationships[3].Name）: 关联属性类型（Entity.Relationships[3].RelatedEntity）%
    ...
    %关联属性名称i（Entity.Relationships[i].Name）: 关联属性类型（Entity.Relationships[i].RelatedEntity）%
}

// ATM系统
class AutomatedTellerMachineSystem {
  PasswordValidated: boolean;
  InputCard: BankCard;
 
  // 插卡操作
  inputCard(cardid: number): boolean {
    ...
  }
  
   // 输入密码
  inputPassword(password: number): boolean {
    ...
  }

  // 查询余额
  checkBalance():number{
    ...
  }

  // 退卡
  ejectCard():boolean{
    ...
  }
}

// 服务模版
class %服务名称（Service.Name）%{
    %变量名称1（Service.TempVariables[1].Name）: 变量类型（Service.TempVariables[1].Type）%
    %变量名称2（Service.TempVariables[2].Name）: 变量类型（Service.TempVariables[2].Type）%
    %变量名称3（Service.TempVariables[3].Name）: 属性类型（Service.TempVariables[3].Type）%
    ...
    %变量名称3（Service.TempVariables[i].Name）: 属性类型（Service.TempVariables[i].Type）%

    %操作名称（Service.Operations[i].Name)% ( ...操作参数（Service.Operations[i].Parameters[j]） ): %返回类型（Service.Operations[i].ReturnType)%{
                                %合约代码（Service.Operations[i].OCLContract）%
    }
}

Contract %服务名称（Service.Name）%::%操作名称（Operation.Name）%(%操作参数（Operation.Parameters[i...*]）): %返回类型（Operation.ReturnType）%{
    definition:
    %定义部分（OCL Generator.Definition）%
    precondition:
    %前置条件（OCL Generator.Precondition）%
    postcondition:
    %后置条件（OCL Generator.Postcondition）%
}

`;
