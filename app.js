/* jshint node:true, evil:true*/

'use strict';

var angular = require('angular');
var toJsonTable = require('json-to-table');
var toMarkdownTable = require('markdown-table');
var marked = require('marked');
var jsonFormat = require('json-format');
var pluralize = require('pluralize');

var addLink = false;
var descriptionColumn = false;

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
	if(addLink){
		return '['+typeName+'](#'  + typeName.toLowerCase() +')'
	}
	else {
		return typeName;
	}
}

function objToDocType(thisObjectName,  obj) {
	var listObjectType = [];

	let listObj = [];

	for (let x in obj) {
		// console.log(x + ':' + obj[x] + ':' + typeof(obj[x]) + ':' + Array.isArray(obj[x]));
		let fieldName = x;
		let typeName = '';
		const objectName = capitalizeFirstLetter(pluralize.singular(x));
		if (isArray(obj[x])) {
			if(isObject(obj[x][0])) {
				typeName = '[' + addLinkedToStringType(objectName) + ']';
				listObjectType = [...listObjectType, ...objToDocType(objectName, obj[x][0])];
			}
			else{
				typeName = '['+typeof(obj[x][0])+']';		
			}
		}
		else if (isObject(obj[x])) {
			typeName = addLinkedToStringType(objectName);
			listObjectType = [...listObjectType, ...objToDocType(objectName, obj[x])];
		}
		else{
			typeName = typeof(obj[x]);
		}
		if(descriptionColumn){
			listObj.push(
				{
					field_name: fieldName,
					type: typeName,
					description: ''
				}
			);
		}
		else {
			listObj.push(
				{
					field_name: fieldName,
					type: typeName
				}
			);
		}
	}

	const objectType = new ObjectType(thisObjectName, listObj);
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
			addLink = $scope.addLink;
			descriptionColumn = $scope.descriptionColumn;
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
				
				let listObjectType = objToDocType(capitalizeFirstLetter($scope.objName || 'MainObject'), inputObject);

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