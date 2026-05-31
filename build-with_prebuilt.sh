#!/bin/bash

IMAGE_NAME=yolo-label-studio
BUILT_TAG=latest

PROJ_ROOT=.

function web_yarn_install {
  folder="$PROJ_ROOT/web"
  echo "----- yarn install -----"
  ( cd $folder && yarn install ) || \
    { echo "Error occured in installing enviroments for web, exiting..."; exit 1002; }
}

function web_clean_dist {
  folder="$PROJ_ROOT/web"
  echo "----- clean dist -----"
  ( cd $folder && rm -rf ./dist ) || \
    { echo "Error occured in cleaning web/dist, exiting..."; exit 1002; }
}

function web_prebuilt {
  folder="$PROJ_ROOT/web"
  echo "----- Build web source -----"
  ( cd $folder && yarn run build ) || \
    { echo "Error occured in prebuilt web, exiting..."; exit 1002; }
}

function web_version_libs {
  folder="$PROJ_ROOT/web"
  echo "----- version web files -----"
  ( cd $folder && yarn version:libs ) || \
    { echo "Error occured in versioning web, exiting..."; exit 1002; }
}

function build_docker_image {
  folder="$PROJ_ROOT"
  echo "----- Build docker image -----"
  (cd $folder && docker build -f ./Dockerfile.web_prebuilt -t "$IMAGE_NAME:$BUILT_TAG" .) || \
      { echo "Error occured in building docker image, exiting..."; exit 1002; }
}

function build_postgres_image {

  echo "----- pulling postgres image -----"
  ( docker pull pgautoupgrade/pgautoupgrade:13-alpine ) || \
    { echo "Error pulling postgres image, exiting..."; exit 1002; }
  

  echo "----- pulling postgres image -----"
  ( docker tag pgautoupgrade/pgautoupgrade:13-alpine "yolo-pgautoupgrade:$BUILT_TAG" ) || \
    { echo "Error tagging postgres image, exiting..."; exit 1002; }
}

# tag images with the specified tags and push to registry
# tags can be a tag name or a comma separated string like "latest,18.15"
# $1 -> tags
# $2 -> registry
# $3 -> namespace
# $4 -> image_prefix
function push_images {
  # get tags if specified, default to latest
  tagstr=latest
  if [ ! -z "$1" ]
  then
    tagstr=$1
  fi

  IFS=',' tags=($tagstr) # convert to array

  registry=$2
  namespace=$3
  image_prefix=$4

  if [[ -z "${namespace// }" ]]; then
    aio="$registry/$image_prefix"
  else
    aio="$registry/$namespace/$image_prefix"
  fi

  declare -a images=(
    $IMAGE_NAME
    # "yolo-pgautoupgrade"
  )

  for t in "${tags[@]}"
  do
    for i in "${images[@]}"
    do
      # !!! currently the build script and pom.xml has v2 for image tag
      # !!! TODO please understand the {BUILD_TAG} in the following line, should be removed after removing aliyun registry
      original_image=${i}:${BUILT_TAG}
      target_image=${aio}${i}:${t}
      echo "==========  Tag image '$original_image' as '$target_image' and push it  "

      docker tag $original_image $target_image || { echo "Failed to tag image '$original_image'"; exit 1003; }

      docker push $target_image                || { echo "Failed to push image '$target_image'"; exit 1004; }
    done
  done
}

# push images to aliyun
# $1 -> tags
function push_aliyun {
  push_images "$1" "registry.cn-hangzhou.aliyuncs.com" "tunan-tb" ""
}

function get_current_branch {
  br=`git rev-parse --abbrev-ref HEAD`
  echo $br;
}

function get_image_tags {
  if [ ! -z "$1" ]
  then
    branch=$1
  else
    branch=`get_current_branch`
  fi
  
  if [[ $branch == "develop" ]];
  then
    echo "develop"

  elif [[ $branch == "master" ]];
  then
    git_tag=`git tag --points-at $branch`
    if [ ! -z "$git_tag" ]
    then
      echo "latest,$git_tag"
    else
      echo "latest"
    fi
  elif [[ $branch == release/* ]];
  then
    version=`echo $branch | sed -E 's/release\/([a-zA-Z0-9\.\-_]+)/\1/' `
    echo "release,rc-$version"
  elif [[ $branch == feature/* ]];
  then
    feature_name=`echo $branch | sed -E 's/feature\/([a-zA-Z0-9\.\-_]+)/\1/' `
    echo "feature-$feature_name"
  elif [[ $branch == hotfix/* ]];
  then
    hotfix_name=`echo $branch | sed -E 's/hotfix\/([a-zA-Z0-9\.\-_]+)/\1/' `
    echo "hotfix-$hotfix_name"
  fi
}



# prompt user
read -p "========= Build Source,War,Image for yolo-label-studio ======== \
 Do you want to continue (y/n)?  " answer
case ${answer:0:1} in
  y|Y )
    web_yarn_install
    web_clean_dist
    web_prebuilt
    web_version_libs

    # build docker images
    build_docker_image

    # build_postgres_image
    
  ;;

  * )
    echo "Bye..."
    # exit 1;
  ;;

esac


# prompt user
read -p "========= Push yolo-label-studio to aliyun/tunan-tb ======== \
 Do you want to continue (y/n)?  " answer
case ${answer:0:1} in
  y|Y )
    tags_to_push=`get_image_tags`

    # push aliyun
    push_aliyun "$tags_to_push"
  ;;

  * )
    echo "Bye..."
    exit 1;
  ;;

esac


### READ ME FOR PUSH IMAGE ###
# docker login --username=zxy@1836402448034381 registry.cn-hangzhou.aliyuncs.com
