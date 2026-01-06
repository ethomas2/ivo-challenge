const fs = require("fs/promises");
const { Project } = require("ts-morph");

async function listHelpers(dir = "./agent_helpers") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let tools = [];
  for (const entry of entries) {
    const fullPath = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      const subTools = await listHelpers(fullPath);
      // Adjust path to be relative to agent_helpers
      tools = tools.concat(subTools.map((t) => `${entry.name}/${t}`));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      tools.push(entry.name);
    }
  }
  return tools;
}

async function readHelper(helperName) {
  // Allow slashes for directories, but still sanitize other chars
  const sanitizedHelperName = helperName.replaceAll(/[^0-9a-zA-Z._\/-]/g, "");
  // Remove ".." to prevent directory traversal
  if (sanitizedHelperName.includes("..")) {
    throw new Error("Invalid helper name");
  }

  const fileName = `./agent_helpers/${sanitizedHelperName}`;
  const contents = await fs.readFile(fileName, "utf-8");
  return contents;
}

async function describeHelper(helperName) {
  // Allow slashes for directories, but still sanitize other chars
  const sanitizedHelperName = helperName.replaceAll(/[^0-9a-zA-Z._\/-]/g, "");
  // Remove ".." to prevent directory traversal
  if (sanitizedHelperName.includes("..")) {
    throw new Error("Invalid helper name");
  }

  const filePath = `./agent_helpers/${sanitizedHelperName}`;
  
  // Use ts-morph to parse the TypeScript file
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(filePath);
  
  const docs = [];
  docs.push(`# ${helperName}\n`);
  
  // Get all exported declarations
  const exportedDeclarations = sourceFile.getExportedDeclarations();
  
  for (const [name, declarations] of exportedDeclarations) {
    for (const declaration of declarations) {
      // Handle variable declarations (const exports)
      if (declaration.getKindName() === 'VariableDeclaration') {
        const varDecl = declaration;
        const type = varDecl.getType();
        
        // Try to get the type declaration (for class types)
        const symbol = type.getSymbol();
        if (symbol) {
          const typeDecls = symbol.getDeclarations();
          for (const typeDecl of typeDecls) {
            if (typeDecl.getKindName() === 'ClassDeclaration') {
              const classDecl = typeDecl;
              docs.push(`## class ${name}`);
              
              // Get class JSDoc comments
              const classJsDocs = classDecl.getJsDocs();
              if (classJsDocs.length > 0) {
                const comment = classJsDocs[0].getDescription().trim();
                if (comment) {
                  docs.push(comment);
                  docs.push('');
                }
              }
              
              // Get constructor
              const constructors = classDecl.getConstructors();
              if (constructors.length > 0) {
                const ctor = constructors[0];
                const params = ctor.getParameters().map(p => p.getText().replace(/\s+/g, ' ')).join(', ');
                docs.push(`### constructor(${params})`);
                
                const ctorJsDocs = ctor.getJsDocs();
                if (ctorJsDocs.length > 0) {
                  const comment = ctorJsDocs[0].getDescription().trim();
                  if (comment) {
                    docs.push(comment);
                  }
                  
                  const paramTags = ctorJsDocs[0].getTags().filter(tag => tag.getTagName() === 'param');
                  if (paramTags.length > 0) {
                    docs.push('');
                    docs.push('**Parameters:**');
                    for (const tag of paramTags) {
                      const paramName = tag.getName();
                      const description = tag.getComment() || '';
                      const descText = typeof description === 'string' ? description : description;
                      if (paramName) {
                        docs.push(`- \`${paramName}\`: ${descText}`);
                      }
                    }
                  }
                }
                docs.push('');
              }
              
              // Get methods
              const methods = classDecl.getMethods();
              for (const method of methods) {
                const methodName = method.getName();
                const params = method.getParameters().map(p => p.getText().replace(/\s+/g, ' ')).join(', ');
                let returnType = method.getReturnType().getText();
                returnType = returnType.replace(/import\(".*?"\)\./g, '');
                
                docs.push(`### ${methodName}(${params}): ${returnType}`);
                
                const methodJsDocs = method.getJsDocs();
                if (methodJsDocs.length > 0) {
                  const comment = methodJsDocs[0].getDescription().trim();
                  if (comment) {
                    docs.push(comment);
                  }
                  
                  const paramTags = methodJsDocs[0].getTags().filter(tag => tag.getTagName() === 'param');
                  if (paramTags.length > 0) {
                    docs.push('');
                    docs.push('**Parameters:**');
                    for (const tag of paramTags) {
                      const paramName = tag.getName();
                      const description = tag.getComment() || '';
                      const descText = typeof description === 'string' ? description : description;
                      if (paramName) {
                        docs.push(`- \`${paramName}\`: ${descText}`);
                      }
                    }
                  }
                  
                  const returnTags = methodJsDocs[0].getTags().filter(tag => tag.getTagName() === 'returns');
                  if (returnTags.length > 0) {
                    docs.push('');
                    docs.push('**Returns:**');
                    const description = returnTags[0].getComment() || '';
                    const descText = typeof description === 'string' ? description : description;
                    docs.push(descText);
                  }
                }
                docs.push('');
              }
              
              // Get properties
              const properties = classDecl.getProperties();
              for (const prop of properties) {
                const propName = prop.getName();
                const propType = prop.getType().getText().replace(/import\(".*?"\)\./g, '');
                const isReadonly = prop.isReadonly();
                
                docs.push(`### ${isReadonly ? 'readonly ' : ''}${propName}: ${propType}`);
                
                const propJsDocs = prop.getJsDocs();
                if (propJsDocs.length > 0) {
                  const comment = propJsDocs[0].getDescription().trim();
                  if (comment) {
                    docs.push(comment);
                  }
                }
                docs.push('');
              }
              break;
            }
          }
        }
        
        // If not a class type, just show the variable with its JSDoc
        if (docs[docs.length - 1] !== '') {
          const varJsDocs = varDecl.getJsDocs();
          if (varJsDocs.length > 0) {
            const comment = varJsDocs[0].getDescription().trim();
            if (comment) {
              docs.push(`## ${name}`);
              docs.push(comment);
              docs.push('');
            }
          }
        }
      }
      // Handle functions
      else if (declaration.getKindName() === 'FunctionDeclaration') {
        const func = declaration;
        const signature = func.getSignature();
        const params = func.getParameters().map(p => {
          // Clean up parameter text to be on one line
          return p.getText().replace(/\s+/g, ' ');
        }).join(', ');
        
        // Get return type and simplify import paths
        let returnType = func.getReturnType().getText();
        // Remove verbose import paths, just keep the type name
        returnType = returnType.replace(/import\(".*?"\)\./g, '');
        
        docs.push(`## ${name}(${params}): ${returnType}`);
        
        // Get JSDoc comments
        const jsDocs = func.getJsDocs();
        if (jsDocs.length > 0) {
          const comment = jsDocs[0].getDescription().trim();
          if (comment) {
            docs.push(comment);
          }
          
          // Get parameter descriptions from @param tags
          const paramTags = jsDocs[0].getTags().filter(tag => tag.getTagName() === 'param');
          if (paramTags.length > 0) {
            docs.push('');
            docs.push('**Parameters:**');
            for (const tag of paramTags) {
              const paramName = tag.getName();
              const description = tag.getComment() || '';
              // Handle both string and structured comment formats
              const descText = typeof description === 'string' ? description : description;
              if (paramName) {
                docs.push(`- \`${paramName}\`: ${descText}`);
              }
            }
          }
        }
        docs.push('');
      }
      // Handle type aliases
      else if (declaration.getKindName() === 'TypeAliasDeclaration') {
        docs.push(`## type ${name}`);
        
        // Get JSDoc comments
        const jsDocs = declaration.getJsDocs();
        if (jsDocs.length > 0) {
          const comment = jsDocs[0].getDescription().trim();
          if (comment) {
            docs.push(comment);
          }
        }
        
        docs.push('```typescript');
        docs.push(declaration.getText().replace(/^export\s+/, ''));
        docs.push('```');
        docs.push('');
      }
      // Handle interfaces
      else if (declaration.getKindName() === 'InterfaceDeclaration') {
        docs.push(`## interface ${name}`);
        
        // Get JSDoc comments
        const jsDocs = declaration.getJsDocs();
        if (jsDocs.length > 0) {
          const comment = jsDocs[0].getDescription().trim();
          if (comment) {
            docs.push(comment);
          }
        }
        
        docs.push('```typescript');
        docs.push(declaration.getText().replace(/^export\s+/, ''));
        docs.push('```');
        docs.push('');
      }
      // Handle classes
      else if (declaration.getKindName() === 'ClassDeclaration') {
        docs.push(`## class ${name}`);
        
        // Get class JSDoc comments
        const classJsDocs = declaration.getJsDocs();
        if (classJsDocs.length > 0) {
          const comment = classJsDocs[0].getDescription().trim();
          if (comment) {
            docs.push(comment);
            docs.push('');
          }
        }
        
        // Get constructor
        const constructors = declaration.getConstructors();
        if (constructors.length > 0) {
          const ctor = constructors[0];
          const params = ctor.getParameters().map(p => p.getText().replace(/\s+/g, ' ')).join(', ');
          docs.push(`### constructor(${params})`);
          
          const ctorJsDocs = ctor.getJsDocs();
          if (ctorJsDocs.length > 0) {
            const comment = ctorJsDocs[0].getDescription().trim();
            if (comment) {
              docs.push(comment);
            }
            
            const paramTags = ctorJsDocs[0].getTags().filter(tag => tag.getTagName() === 'param');
            if (paramTags.length > 0) {
              docs.push('');
              docs.push('**Parameters:**');
              for (const tag of paramTags) {
                const paramName = tag.getName();
                const description = tag.getComment() || '';
                const descText = typeof description === 'string' ? description : description;
                if (paramName) {
                  docs.push(`- \`${paramName}\`: ${descText}`);
                }
              }
            }
          }
          docs.push('');
        }
        
        // Get methods
        const methods = declaration.getMethods();
        for (const method of methods) {
          const methodName = method.getName();
          const params = method.getParameters().map(p => p.getText().replace(/\s+/g, ' ')).join(', ');
          let returnType = method.getReturnType().getText();
          returnType = returnType.replace(/import\(".*?"\)\./g, '');
          
          docs.push(`### ${methodName}(${params}): ${returnType}`);
          
          const methodJsDocs = method.getJsDocs();
          if (methodJsDocs.length > 0) {
            const comment = methodJsDocs[0].getDescription().trim();
            if (comment) {
              docs.push(comment);
            }
            
            const paramTags = methodJsDocs[0].getTags().filter(tag => tag.getTagName() === 'param');
            if (paramTags.length > 0) {
              docs.push('');
              docs.push('**Parameters:**');
              for (const tag of paramTags) {
                const paramName = tag.getName();
                const description = tag.getComment() || '';
                const descText = typeof description === 'string' ? description : description;
                if (paramName) {
                  docs.push(`- \`${paramName}\`: ${descText}`);
                }
              }
            }
            
            const returnTags = methodJsDocs[0].getTags().filter(tag => tag.getTagName() === 'returns');
            if (returnTags.length > 0) {
              docs.push('');
              docs.push('**Returns:**');
              const description = returnTags[0].getComment() || '';
              const descText = typeof description === 'string' ? description : description;
              docs.push(descText);
            }
          }
          docs.push('');
        }
        
        // Get properties
        const properties = declaration.getProperties();
        for (const prop of properties) {
          const propName = prop.getName();
          const propType = prop.getType().getText().replace(/import\(".*?"\)\./g, '');
          const isReadonly = prop.isReadonly();
          
          docs.push(`### ${isReadonly ? 'readonly ' : ''}${propName}: ${propType}`);
          
          const propJsDocs = prop.getJsDocs();
          if (propJsDocs.length > 0) {
            const comment = propJsDocs[0].getDescription().trim();
            if (comment) {
              docs.push(comment);
            }
          }
          docs.push('');
        }
      }
    }
  }
  
  return docs.join('\n').trim() || `# ${helperName}\n\nNo exported API found.`;
}

const describeHelperTool = {
  type: "function",
  name: "describeHelper",
  description: "Get TypeScript API documentation for a helper file (types, function signatures, JSDoc comments).",
  parameters: {
    type: "object",
    properties: {
      helperName: {
        type: "string",
        description: "The name of the helper file",
      },
    },
    required: ["helperName"],
    additionalProperties: false,
  },
  handler: async ({ helperName }) => {
    return await describeHelper(helperName);
  },
};

exports.listHelpers = listHelpers;
exports.readHelper = readHelper;
exports.describeHelper = describeHelper;
exports.describeHelperTool = describeHelperTool;
