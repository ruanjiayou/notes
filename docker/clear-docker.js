const shell = require('shelljs')
const whitelist = ['node', 'nginx', 'redis', 'mongo']

const str = shell.exec('docker images').stdout
const images = str.split('\n')
images.shift()
const res = []
images.forEach(image => {
    let [name, version, id, date, size] = image.replace(/\s=/g, '').split(' ')
    if (!whitelist.includes(name)) {
        res.push(version === '<none>' || name === '<none>' ? id : `${name}:${version}`)
    }
})
shell.exec('docker rmi ' + res.join(' '))