'use client'

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Box,
  Badge,
  VStack,
  Skeleton,
  useColorModeValue,
} from '@chakra-ui/react'
import { TableRow } from '@/types'

interface ReadOnlyTableProps {
  data?: TableRow[]
  fields?: string[]
  loading?: boolean
}

export function ReadOnlyTable({
  data = [],
  fields = [],
  loading = false,
}: ReadOnlyTableProps) {
  const headerBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const emptyTextColor = useColorModeValue('gray.500', 'gray.400')
  const rowHoverBg = useColorModeValue('gray.50', 'gray.800')

  if (loading) {
    return (
      <TableContainer borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflowX="auto">
        <Table size="sm">
          <Thead bg={headerBg}>
            <Tr>
              <Th w="80px">
                <Skeleton height="18px" />
              </Th>
              {fields.map((field) => (
                <Th key={field} minW="160px">
                  <Skeleton height="18px" />
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <Tr key={index}>
                <Td>
                  <Skeleton height="16px" />
                </Td>
                {fields.map((field) => (
                  <Td key={field}>
                    <Skeleton height="14px" />
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    )
  }

  if (!data.length) {
    return (
      <Box
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={10}
        textAlign="center"
        color={emptyTextColor}
      >
        暂无数据
      </Box>
    )
  }

  return (
    <TableContainer borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflowX="auto">
      <Table size="sm">
        <Thead bg={headerBg}>
          <Tr>
            <Th w="80px">行ID</Th>
            {fields.map((field) => (
              <Th key={field} minW="160px">
                {field}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((row) => (
            <Tr key={row.id} _hover={{ bg: rowHoverBg }}>
              <Td>
                <Badge variant="subtle" colorScheme="gray">
                  {row.id}
                </Badge>
              </Td>
              {fields.map((field) => (
                <Td key={field} whiteSpace="pre-wrap">
                  {row[field] ? (
                    typeof row[field] === 'string' ? (
                      row[field]
                    ) : (
                      <VStack align="start" spacing={1}>
                        <Text fontSize="xs" color="gray.500">{field}</Text>
                        <Text>{JSON.stringify(row[field])}</Text>
                      </VStack>
                    )
                  ) : (
                    <Text color="gray.400">-</Text>
                  )}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  )
}
