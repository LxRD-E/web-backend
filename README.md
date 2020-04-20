# dev setup
0. pull repository
1. `npm i`
2. install mysql and redis
3. `npm run start:dev`
4. wait for compilation
5. ...
6. profit

# env
```SECRET_ENCRYPTION_KEY```
32-bit key used for encrypting config.json file

---

```SECRET_ENCRYPTION_IV```
8-bit iv used for encrypting config.json file

---

```IS_STAGING```
If set to 1, disables captchas and enables certain features that should only be accessible in staging envs