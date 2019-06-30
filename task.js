const ts = require('typescript');
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const glob = require('glob');

module.exports = (logger, dirname, config) => {

  return () => {

    return new Promise((resolve, reject) => {

      // Validate config
      if ( (! config.outDir || ! config.rootDir) && ! config.tsconfig ) return reject(new Error('TypeScript plugin misconfiguration! Either outDir and rootDir or tsconfig must be present.'));

      let finalOptions = _.cloneDeep(config);

      delete finalOptions.cleanOutDir;

      // Load tsconfig.json if necessary
      if ( config.tsconfig ) {

        try {

          let tsconfig = fs.readJsonSync(path.join(dirname, config.tsconfig));

          finalOptions = tsconfig.compilerOptions;

        }
        catch (error) {

          return reject(new Error(`Could not load "${path.join(dirname, config.tsconfig)}"!`));

        }

      }

      // Empty outDir if necessary
      if ( config.cleanOutDir ) {

        fs.emptyDirSync(path.join(dirname, finalOptions.outDir));

      }

      // Sanitize lib
      if ( finalOptions.lib && finalOptions.lib.map ) {

        finalOptions.lib = finalOptions.lib.map(lib => `lib.${lib}.d.ts`);

      }

      // Search `config.rootDir` for `.ts` files
      glob('**/*.ts', { cwd: path.join(dirname, finalOptions.rootDir) }, (error, files) => {

        if ( error ) return reject(error);

        logger(`Transpiling ${files.length} files...`);

        // Create program
        const program = ts.createProgram(files.map(file => path.join(dirname, finalOptions.rootDir, file)), finalOptions);
        let emitResult = program.emit();
        let diagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

        diagnostics.forEach(diagnostic => {

          if ( diagnostic.file ) {

            const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

            logger(`TypeScript: ${diagnostic.file.fileName} (${position.line + 1},${position.character + 1}): ${message}`);

          }
          else {

            logger(`TypeScript: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);

          }

        });

        logger(`${files.length} files were transpiled.`);

        resolve();

      });

    });

  };

};
