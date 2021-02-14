let ts = require('typescript');
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const glob = require('glob');

module.exports = (logger, dirname, config) => {

  return () => {

    return new Promise((resolve, reject) => {

      // Load local TypeScript
      if ( config.useLocal ) {

        try {

          ts = require(path.join(dirname, 'node_modules', 'typescript'));

          if ( ! ts ) throw new Error();

          logger('Using local TypeScript...');

        }
        catch (error) {

          logger('Could not find local TypeScript! Using the shipped version instead...');

        }

      }

      // Validate config
      if ( (! config.outDir || ! config.rootDir) && ! config.tsconfig ) return reject(new Error('TypeScript plugin misconfiguration! Either outDir and rootDir or tsconfig must be present.'));

      let finalOptions = _.cloneDeep(config);
      let tsConfigExclude;

      delete finalOptions.cleanOutDir;

      // Load tsconfig.json if necessary
      if ( config.tsconfig ) {

        try {

          let tsconfig = fs.readJsonSync(path.resolve(dirname, config.tsconfig));

          finalOptions = tsconfig.compilerOptions;
          tsConfigExclude = (tsconfig.exclude || []).map(filename => path.resolve(dirname, path.dirname(config.tsconfig), filename));
          tsConfigExclude = tsConfigExclude.map(filename => {

            try {

              let stat = fs.lstatSync(filename);

              return stat.isDirectory() ? path.join(filename, '**', '*.ts') : filename;

            }
            catch (error) {

              return null;

            }

          })
          .filter(filename => filename !== null);

        }
        catch (error) {

          return reject(new Error(`Could not load "${path.resolve(dirname, config.tsconfig)}"!\n${error}`));

        }

      }

      // Resolve ourDir and rootDir
      finalOptions.outDir = path.join(path.dirname(config.tsconfig), finalOptions.outDir);
      finalOptions.rootDir = path.join(path.dirname(config.tsconfig), finalOptions.rootDir);

      // Empty outDir if necessary
      if ( config.cleanOutDir ) {

        fs.emptyDirSync(path.resolve(dirname, finalOptions.outDir));

      }

      // Sanitize lib
      if ( finalOptions.lib && finalOptions.lib.map ) {

        finalOptions.lib = finalOptions.lib.map(lib => `lib.${lib}.d.ts`);

      }

      // Search `config.rootDir` for `.ts` files
      glob(path.resolve(dirname, finalOptions.rootDir, '**/*.ts'), {
        ignore: tsConfigExclude
      }, (error, files) => {

        if ( error ) return reject(error);

        logger(`Transpiling ${files.length} files...`);

        // Create program
        const program = ts.createProgram(files.map(file => path.resolve(dirname, finalOptions.rootDir, file)), finalOptions);
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
