

## Links

firebase project
*https://console.firebase.google.com/project/kriket-system/overview*

mpaycz api
*https://developer.mapy.cz/account/project/315/dashboard*

google cloud billing
*https://console.cloud.google.com/billing/budgets?referrer=search&project=kriket-system*

daily limit on spending
*https://console.cloud.google.com/appengine/start?project=kriket-system*
_musi se asi deploynout aby se tam ukazala ta aplikace_

## Git rebase

rebase commits from dev branch to one commit on main branch

```
git checkout main
git merge --squash -X theirs dev
git commit -m "merged dev"
git push origin main
```


## Redirect to wip.html

Edit hosting in firebase.json
```json
  "hosting": {
    "public": "./front-end/build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "redirects": [
      {
        "source": "/",
        "destination": "/wip.html",
        "type": 307
      }
    ]
  },
```

Restrict from writing to firestore
firestore.rules
```json
{
  "rules": {
    ".read": true,
    ".write": false
  }
}
```

or in firebase console
```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Make user admin


Edit user document in firestore

NOTE: document id is the same as use id

```json
"role": "official"
```


## TODO


davat parent name jako default value (ukladat do userdocument)
druhy jmeno rodice (k druhymu contaktnimu emailu)



playerType musi byt vetsi rozliseni (chris posle list)
	pridat other option (jako v after club action)

plyerNationality musi byt dropdown (chris posle list)
	

do budoucna zamezit duplikaty hracu


admini si musi mit moznost deaktivovat ucty  rodicu
