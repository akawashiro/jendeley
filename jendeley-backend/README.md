# jendeley
`jendeley` is a JSON-based paper organizing software.
- `jendeley` is JSON-based. You can see and edit your database easily.
- `jendeley` can work locally. Your important database is owned only by you. Not cloud.
- `jendeley` is browser based. You can run it anywhere node.js runs.

## Install
```
npm install @a_kawashiro/jendeley -g
```

## How to scan your PDFs
```
jendeley scan --papers_dir <YOUR PDFs DIR>
```


## Launch jendeley UI
```
jendeley launch --db <YOUR PDFs DIR>/jendeley_db.json
```
Then you can see a screen like this!
![image](https://user-images.githubusercontent.com/3770618/207363753-e8f16a6e-9c5d-4943-a7de-11fbcdda935e.png)

## Check your database
Because `jendeley` is fully JSON-based, you can check the contents of the
database easily. For example, you can use `jq` command to list up all titles in
your database with the following command.
```
> cat test_pdfs/db.json | jq '.[].title'
"MobileNets: Efficient Convolutional Neural Networks for Mobile Vision\n  Applications"
"Deep Residual Learning for Image Recognition"
"A quantum hydrodynamical description for scrambling and many-body chaos"
```
