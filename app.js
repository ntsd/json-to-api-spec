/* jshint node:true, evil:true*/

'use strict';

var angular = require('angular');
var toJsonTable = require('json-to-table');
var toMarkdownTable = require('markdown-table');
var marked = require('marked');
var jsonFormat = require('json-format');
var pluralize = require('pluralize');

class ObjectType {
	constructor(objectName, object) {
		this.objectName = objectName;
		this.object = object;
	}
}

function capitalizeFirstLetter(string) {
    return string[0].toUpperCase() + string.slice(1);
}

function isArray (value) {
	return value && typeof value === 'object' && value.constructor === Array;
}

function isObject (value) {
	return value && typeof value === 'object' && value.constructor === Object;
}

function addLinkedToStringType(typeName) {
	return '['+typeName+'](#'  + typeName.toLowerCase() +')'
}

function objToDocType(objectName,  obj) {
	var listObjectType = [];

	let listObj = [];

	for (let x in obj) {
		// console.log(x + ':' + obj[x] + ':' + typeof(obj[x]) + ':' + Array.isArray(obj[x]));
		const objectName = capitalizeFirstLetter(pluralize.singular(x));
		if (isArray(obj[x])) {
			if(isObject(obj[x][0])) {
				listObj.push(
					{
						field_name: x,
						type: '['+addLinkedToStringType(objectName)+']',
						description: ''
					}
				);
				listObjectType = [...listObjectType, ...objToDocType(objectName, obj[x][0])];
			}
			else{
				listObj.push(
					{
						field_name: x,
						type: '['+typeof(obj[x][0])+']',
						description: ''
					}
				);
			}
		}
		else if (isObject(obj[x])) {
			listObj.push(
				{
					field_name: x,
					type: addLinkedToStringType(objectName),
					description: ''
				}
			);
			listObjectType = [...listObjectType, ...objToDocType(objectName, obj[x])];
		}
		else{
			listObj.push(
				{
					field_name: x,
					type: typeof(obj[x]),
					description: ''
				}
			);
		}	
	}



	const objectType = new ObjectType(objectName, listObj);
	listObjectType.push(objectType);
	// console.log('in func', listObjectType);

	return listObjectType;
}

angular
	.module('app', [
		require('angular-sanitize'),
		require('angular-highlightjs'),
		require('angular-clipboard').name,
	])
	.controller('appController', function($scope, $document, clipboard) {
		$scope.jsonInputVisible = true;
		$scope.jsonToMarkdownTable = function() {
			$scope.error = null;
			$scope.processed = false;
			$scope.jsonOutput = '';
			$scope.markdownOutput = '';
			$scope.htmlOutput = '';
			if(!$scope.jsonInput.trim()){
				return;
			}
			var inputObject;
			try {
				try {
					inputObject = eval('(' + $scope.jsonInput + ')');
				} catch (e){
					inputObject = JSON.parse($scope.jsonInput);
				}
				
				let listObjectType = objToDocType('MainObject', inputObject);

				listObjectType.reverse();

				console.log(listObjectType);
				
				let jsonTextAll = [];
				let markdownTextAll = [];
				let htmlOutputTextAll = [];

				for (let i in listObjectType) {
					const jsonTable = toJsonTable(listObjectType[i].object);
					const jsonText = jsonFormat(listObjectType[i]);
					let markdownText = toMarkdownTable(jsonTable);
					markdownText = '### '+listObjectType[i].objectName+'\n'+markdownText;
					const htmlOutputText = marked(markdownText);

					jsonTextAll.push(jsonText);
					markdownTextAll.push(markdownText);
					htmlOutputTextAll.push(htmlOutputText);
					console.log(listObjectType[i]);

				}
				
				$scope.jsonOutput = jsonTextAll.join('\n\n');
				$scope.markdownOutput = markdownTextAll.join('\n\n');
				$scope.htmlOutput = htmlOutputTextAll.join('<br>');

				$scope.processed = true;
			} catch(e){
				$scope.error = e;
				throw e;
			}
		};

		$scope.copyJson = function(){
			clipboard.copyText($scope.jsonOutput);
		};

		$scope.copyMarkdown = function(){
			clipboard.copyText($scope.markdownOutput);
		};

		$scope.copyHtml = function(){
			clipboard.copyText($scope.htmlOutput);
		};

		$scope.hideJsonInput = function() {
			if($scope.processed){
				$scope.jsonInputVisible = false;
			}
		};

		$scope.showJsonInput = function() {
			$scope.jsonInputVisible = true;
			var inputJson = document.getElementById('input-json');
			setTimeout(function(){
				inputJson.focus();
				inputJson.select();
			}, 1);
			
		};
	});