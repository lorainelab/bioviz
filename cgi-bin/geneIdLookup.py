#!/usr/bin/env python3

#IGBF-1495 - Re-factor geneIdLookup.py to query dynamodb table instead of reading flat file
import cgi
import csv
import re
import json
import sys
import boto3
import os
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
# import cgitb; cgitb.enable()  # for troubleshooting
import cgitb
cgitb.enable()

def checkId(gene_id=None):
    "Make sure user did not enter bogus id."
    regex = re.compile("^AT[1-5CM]G\d{5}$")
    if not regex.match(gene_id):
        raise ValueError("Illegal gene id: %s\n" % gene_id)
    else:
        return gene_id


def getGeneRegion(gene_id):
    #get data from dynamodb using gene-id
    dynamodb = boto3.resource('dynamodb',region_name='us-east-1')
    # table is an object for Araport11 dynamodb table
    table = dynamodb.Table('Araport11')
    response1 = table.query(KeyConditionExpression=Key('GeneId').eq(str(gene_id)))
    response = response1['Items']
    d= {"gene_id":response[0]['GeneId'],"seqid":response[0]['Chromosome'],"start": int(response[0]['Start']) ,"end": int(response[0]['End'])}
    return(d)

def getGeneId():
    #get gene-id from the link
    arguments = cgi.FieldStorage()
    if arguments:
        gene_id = None
        for key in arguments.keys():
            if key == "gene_id":
                return checkId(arguments[key].value)
    else:
        return checkId("AT1G01180")  # for testing


def main():
    sys.stdout.write('Content-Type: application/json\n\n')
    gene_id=getGeneId()
    d = json.dumps(getGeneRegion(gene_id))
    sys.stdout.write(d)
    sys.stdout.write('\n')


main()
