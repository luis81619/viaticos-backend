import {
  DefaultNamingStrategy,
  NamingStrategyInterface,
} from 'typeorm';

function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s.-]+/g, '_')
    .replace(/__+/g, '_')
    .toLowerCase();
}

export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(
    targetName: string,
    userSpecifiedName?: string,
  ): string {
    return userSpecifiedName ?? toSnakeCase(targetName);
  }

  columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    const name = customName || propertyName;

    return toSnakeCase(
      [...embeddedPrefixes, name].join('_'),
    );
  }

  relationName(propertyName: string): string {
    return toSnakeCase(propertyName);
  }

  joinColumnName(
    relationName: string,
    referencedColumnName: string,
  ): string {
    return toSnakeCase(
      `${relationName}_${referencedColumnName}`,
    );
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
  ): string {
    return toSnakeCase(
      `${firstTableName}_${firstPropertyName.replace(
        /\./g,
        '_',
      )}_${secondTableName}`,
    );
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return toSnakeCase(
      `${tableName}_${columnName || propertyName}`,
    );
  }

  classTableInheritanceParentColumnName(
    parentTableName: string,
    parentTableIdPropertyName: string,
  ): string {
    return toSnakeCase(
      `${parentTableName}_${parentTableIdPropertyName}`,
    );
  }
}