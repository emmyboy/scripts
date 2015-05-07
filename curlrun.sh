#!/bin/bash

CNAME="media.scores.com"
HOST_LIST=( $( echo media-node{508,525,532,533,538,546,549,550,551,552,553}.scores.com ) )
TARGET_RUN_COUNT=5000
PORT=8008

CURL_OUT="%{http_code} %{time_namelookup} %{time_connect} %{time_appconnect} %{time_pretransfer} %{time_redirect} %{time_starttransfer} %{time_total}"

echo "Starting at $( date )"
( for CHECK_HOST in ${HOST_LIST[@]}; do
    echo "HOST: $CHECK_HOST ================================="
    EXCEEDED=0
    RUN_COUNT=0
    for RUN in $( seq 1 $TARGET_RUN_COUNT ); do
        CURL_CMD="curl -k -s --compress                     \
                    -w \"$CURL_OUT\n\"                      \
                    -o /dev/null                            \
                    -H 'Host: $CNAME'    \
                    'http://$CHECK_HOST:$PORT/v1/?xyzzy=$RUN'"   ## puts traceable info into URL to check in ats logs
        RUN_COUNT=$(( $RUN_COUNT+1 ))
        STATS=( $( eval "$CURL_CMD" ) )
        code=${STATS[0]}
        nmlu=${STATS[1]}
        conn=${STATS[2]}
        apcn=${STATS[3]}
        prex=${STATS[4]}
        redr=${STATS[5]}
        strx=${STATS[6]}
        totl=${STATS[7]}
        if [[ "$( echo "$totl>1" | bc -l )" -eq 1 ]] ; then
            echo "$(printf "%4d" $RUN ) - $code namelookup:$nmlu, connect:$conn, appconnect:$apcn, pretransfer:$prex, redirect:$redr, starttransfer:$strx, total:$totl"
            EXCEEDED=$(( $EXCEEDED+1 ))
        fi
    done;
    echo "$CHECK_HOST: $EXCEEDED/$RUN_COUNT runs exceeded 1 second total"
done ) | tee -a "/tmp/testscreen.out"
