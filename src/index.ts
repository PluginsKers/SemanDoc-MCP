import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import minimist from "minimist";

let SEMANDOC_API_BASE_URL: string;

const server = new McpServer({
	name: "semandoc-mcp",
	version: "1.0.0",
	capabilities: {
		resources: {},
		tools: {},
	},
});

server.tool(
	"create_document",
	"在知识库中创建一个新的文档。文档内容是必须的，同时可以选择性地添加元数据，如标签和分类，以便于后续的检索和管理。",
	{
		content: z.string().describe("要添加到知识库的文档内容。"),
		metadata: z
			.object({
				tags: z
					.array(z.string())
					.optional()
					.describe(
						"与文档关联的标签列表。用于细粒度的内容分类和搜索。"
					),
				categories: z
					.array(z.string())
					.optional()
					.describe("文档所属的分类列表。用于宏观的内容组织。"),
			})
			.describe("文档的元数据，包含标签和分类。"),
	},
	async (params) => {
		try {
			const response = await fetch(
				`${SEMANDOC_API_BASE_URL}/documents/`,
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
			console.error("Error creating document:", error);
			throw error;
		}
	}
);

server.tool(
	"search_documents",
	"在知识库中根据关键词、标签或分类搜索相关文档。可以指定返回的文档数量。",
	{
		query: z.string().describe("用于搜索文档的关键词或问题。"),
		k: z
			.number()
			.optional()
			.default(5)
			.describe("要返回的最相关文档的数量。默认为5。"),
		tags: z
			.array(z.string())
			.optional()
			.describe(
				"用于过滤搜索结果的标签列表。只有包含这些标签的文档才会被返回。"
			),
		categories: z
			.array(z.string())
			.optional()
			.describe(
				"用于过滤搜索结果的分类列表。只有属于这些分类的文档才会被返回。"
			),
	},
	async (params) => {
		try {
			const response = await fetch(
				`${SEMANDOC_API_BASE_URL}/documents/search/`,
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
	"根据提供的唯一文档ID，从知识库中检索并返回单个文档的详细信息。",
	{
		document_id: z.string().describe("要检索的文档的唯一标识符。"),
	},
	async (params) => {
		try {
			const response = await fetch(
				`${SEMANDOC_API_BASE_URL}/documents/${params.document_id}`,
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
	"分页列出知识库中的所有文档。可以通过标签或分类进行过滤。",
	{
		skip: z
			.number()
			.optional()
			.default(0)
			.describe("要跳过的文档数量，用于分页。默认为0。"),
		limit: z
			.number()
			.optional()
			.default(100)
			.describe("要返回的文档最大数量。默认为100。"),
		tag: z.string().optional().describe("根据单个标签过滤文档。"),
		category: z.string().optional().describe("根据单个分类过滤文档。"),
	},
	async (params) => {
		try {
			const url = new URL(`${SEMANDOC_API_BASE_URL}/documents/`);
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

server.tool(
	"get_stats",
	"获取知识库的总体统计信息，例如文档总数、标签总数和分类总数。",
	{},
	async () => {
		try {
			const response = await fetch(
				`${SEMANDOC_API_BASE_URL}/documents/stats/overview`,
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
	}
);

server.tool(
	"delete_document",
	"根据提供的唯一文档ID，从知识库中删除一个文档。",
	{
		document_id: z.string().describe("要删除的文档的唯一标识符。"),
	},
	async (params) => {
		try {
			const response = await fetch(
				`${SEMANDOC_API_BASE_URL}/documents/${params.document_id}`,
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
	const args = minimist(process.argv.slice(2));
	const host = args.host || "localhost";
	const port = args.port || 17548;
	SEMANDOC_API_BASE_URL = `http://${host}:${port}`;
	console.warn(SEMANDOC_API_BASE_URL);
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.warn("SemanDoc MCP Server running on stdio");
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
