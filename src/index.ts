import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create server instance
const server = new McpServer({
	name: "semandoc-mcp",
	version: "1.0.0",
	capabilities: {
		resources: {},
		tools: {},
	},
});

// Register tool handlers
server.tool(
	"create_document",
	"在知识库中添加文档",
	{
		content: z.string(),
		metadata: z.object({
			tags: z.array(z.string()).optional(),
			categories: z.array(z.string()).optional(),
		}),
	},
	async (params) => {
		try {
			const response = await fetch("http://localhost:8000/documents/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(params),
			});
			const result = await response.json();
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		} catch (error) {
			console.error("Error creating document:", error);
			throw error;
		}
	}
);

server.tool(
	"search_documents",
	"搜索知识库中有关的的信息",
	{
		query: z.string(),
		k: z.number().optional().default(5),
		tags: z.array(z.string()).optional(),
		categories: z.array(z.string()).optional(),
	},
	async (params) => {
		try {
			const response = await fetch(
				"http://localhost:8000/documents/search/",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(params),
				}
			);
			const result = await response.json();
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		} catch (error) {
			console.error("Error searching documents:", error);
			throw error;
		}
	}
);

server.tool(
	"get_document",
	"根据文档的ID获取知识库中的信息",
	{
		document_id: z.string(),
	},
	async (params) => {
		try {
			const response = await fetch(
				`http://localhost:8000/documents/${params.document_id}`,
				{
					method: "GET",
				}
			);
			const result = await response.json();
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		} catch (error) {
			console.error("Error getting document:", error);
			throw error;
		}
	}
);

server.tool(
	"list_documents",
	"分页列出知识库中的信息",
	{
		skip: z.number().optional().default(0),
		limit: z.number().optional().default(100),
		tag: z.string().optional(),
		category: z.string().optional(),
	},
	async (params) => {
		try {
			const url = new URL("http://localhost:8000/documents/");
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, value.toString());
				}
			});
			const response = await fetch(url.toString(), {
				method: "GET",
			});
			const result = await response.json();
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		} catch (error) {
			console.error("Error listing documents:", error);
			throw error;
		}
	}
);

server.tool("get_stats", "获取知识库的统计信息", {}, async () => {
	try {
		const response = await fetch(
			"http://localhost:8000/documents/stats/overview",
			{
				method: "GET",
			}
		);
		const result = await response.json();
		return {
			content: [{ type: "text", text: JSON.stringify(result) }],
		};
	} catch (error) {
		console.error("Error getting stats:", error);
		throw error;
	}
});

server.tool(
	"delete_document",
	"根据文档的ID删除知识库中的信息",
	{
		document_id: z.string(),
	},
	async (params) => {
		try {
			const response = await fetch(
				`http://localhost:8000/documents/${params.document_id}`,
				{
					method: "DELETE",
				}
			);
			const result = await response.json();
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		} catch (error) {
			console.error("Error deleting document:", error);
			throw error;
		}
	}
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("SemanDoc MCP Server running on stdio");
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
