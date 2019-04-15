#! /bin/bash
# 列出所有.pub
getFiles() {
    for file in `ls $1`
    do
        suffix=${file:0-4:4}
        if [ $suffix = '.pub' ]
        then
            echo "$file"
        fi
    done
}
getFiles
read -p "请输入agent: " agent
echo `ssh-agent bash`
echo `eval "$(ssh-agent -s)"`
echo `ssh-add ~/.ssh/$agent`