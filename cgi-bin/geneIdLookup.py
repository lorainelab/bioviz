#!/usr/bin/env python

import cgi
import csv
import re
import json
import sys
#import cgitb; cgitb.enable()  # for troubleshooting


def getJsonString(d=None):
    return json.dumps(d)

def checkId(gene_id=None):
    "Make sure user did not enter bogus id."
    regex=re.compile("^AT[1-5CM]G\d{5}$")
    if not regex.match(gene_id):
        raise ValueError("Illegal gene id: %s\n"%gene_id)
    else:
        return gene_id

def getGeneRegion(gene_id="AT1G07350"):
    "Look up location of gene region."
    start=None
    end=None
    seqid=None
    with open("Araport11.bed") as csv_file:
        csv_reader=csv.reader(csv_file,delimiter="\t")
        for row in csv_reader:
            transcript_id=row[3]
            toks=transcript_id.split('.')
            if toks[0]==gene_id:
                if not start or int(toks[1])<start:
                    start=int(row[1])
                if not end or int(row[2])>end:
                    end=int(row[2])
                if not seqid:
                    seqid=row[0]
                else:
                    if not row[0]==seqid:
                        raise ValueError("Gene %s is on more than 1 chromosome\n",gene_id)
    if not start or not end or not seqid:
        raise ValueError("Can't find location of %s\n",gene_id)
    else:
        d={"gene_id":gene_id,"seqid":seqid,"start":start,"end":end}
        return d

def getGeneId():
    arguments=cgi.FieldStorage()
    if arguments:
        gene_id=None
        for key in arguments.keys():
            if key=="gene_id":
                return checkId(arguments[key].value)
    else:
        return checkId("AT1G07350") # for testing

def doIt():
    sys.stdout.write('Content-Type: application/json\n\n')
    gene_id=getGeneId()
    d = getGeneRegion(gene_id=gene_id)
    json.dump(d,sys.stdout)
    sys.stdout.write("\n")


doIt()
