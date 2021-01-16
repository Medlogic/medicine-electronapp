# install serialport
```
https://serialport.io/docs/guide-installation
When you first install serialport it will compile against the version of Node.js on your machine, not against the Node.js runtime bundled with Electron.

To recompile serialport (or any native Node.js module) for Electron, you can use electron-rebuild; more info at Electron's README.

npm install --save-dev electron-rebuild
Add electron-rebuild to your project's package.json's install hook
Run npm install

For an example project, check out electron-serialport.
https://github.com/serialport/electron-serialport

//npm install serialport@"^6.2.2" --unsafe-perm --build-from-source
```

# medicine-electronapp
```
---
```

# Development

## Starting the app

```
npm start
```


## Environments

Environmental variables are done in a bit different way (not via `process.env`). Env files are plain JSONs in `config` directory, and build process dynamically links one of them as an `env` module. You can import it wherever in code you need access to the environment.
```js
import env from "env";
console.log(env.name);
```


# Making a release

To package your app into an installer use command:
```
npm run release
```

It will start the packaging process. Once the process finished, the `dist` directory will contain your distributable file.

We use [electron-builder](https://github.com/electron-userland/electron-builder) to handle the packaging process. It has a lot of [customization options](https://www.electron.build/configuration/configuration), which you can declare under `"build"` key in `package.json`.

You can package your app cross-platform from a single operating system, [electron-builder kind of supports this](https://www.electron.build/multi-platform-build), but there are limitations and asterisks. That's why this boilerplate doesn't do that by default.
